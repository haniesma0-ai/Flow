<?php
// app/Http/Controllers/Api/InvoiceController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InvoiceController extends Controller
{
    private function formatInvoice($invoice)
    {
        return [
            'id' => $invoice->id,
            'invoiceNumber' => $invoice->invoice_number,
            'orderId' => $invoice->order_id,
            'customerId' => $invoice->customer_id,
            'customer' => $invoice->customer ? [
                'id' => $invoice->customer->id,
                'name' => $invoice->customer->name,
                'email' => $invoice->customer->email,
                'phone' => $invoice->customer->phone,
            ] : null,
            'amount' => (float) $invoice->amount,
            'paidAmount' => (float) $invoice->paid_amount,
            'remainingAmount' => (float) ($invoice->amount - $invoice->paid_amount),
            'status' => $invoice->status,
            'dueDate' => $invoice->due_date?->toISOString(),
            'paidAt' => $invoice->paid_at?->toISOString(),
            'createdAt' => $invoice->created_at?->toISOString(),
            'updatedAt' => $invoice->updated_at?->toISOString(),
        ];
    }

    public function index(Request $request)
    {
        $query = Invoice::with(['order.customer', 'customer']);

        // Filtrage par statut
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtrage par client
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $invoices = $query->orderBy('created_at', 'desc')->get();

        $formatted = $invoices->map(fn($invoice) => $this->formatInvoice($invoice));

        return response()->json([
            'success' => true,
            'data' => $formatted,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'due_date' => 'required|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $order = \App\Models\Order::find($request->order_id);

        // Vérifier si une facture existe déjà pour cette commande
        if ($order->invoice()->exists()) {
            return response()->json(['error' => 'Invoice already exists for this order'], 422);
        }

        // Générer le numéro de facture
        $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad(Invoice::count() + 1, 4, '0', STR_PAD_LEFT);

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'order_id' => $request->order_id,
            'customer_id' => $order->customer_id,
            'amount' => $order->total,
            'paid_amount' => 0,
            'status' => 'pending',
            'due_date' => $request->due_date,
        ]);

        $customerName = $order->customer->name ?? 'Client';
        Notification::notifyRole(
            ['admin', 'manager'],
            'invoice',
            'Nouvelle facture',
            "Facture {$invoiceNumber} créée pour {$customerName} — " . number_format($order->total, 2) . ' MAD.',
            '/dashboard/invoices'
        );

        // Notify the commercial who owns the order
        if ($order->commercial_id) {
            Notification::notifyUser(
                $order->commercial_id,
                'invoice',
                'Facture créée',
                "Facture {$invoiceNumber} pour votre commande {$order->order_number} a été créée.",
                '/dashboard/invoices'
            );
        }

        $invoice->load(['order.customer', 'customer']);

        return response()->json([
            'success' => true,
            'data' => $this->formatInvoice($invoice),
            'message' => 'Invoice created successfully',
        ], 201);
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['order.customer', 'customer', 'payments']);
        return response()->json([
            'success' => true,
            'data' => $this->formatInvoice($invoice),
        ]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $validator = Validator::make($request->all(), [
            'due_date' => 'sometimes|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $invoice->update($request->only(['due_date']));
        $invoice->load(['order.customer', 'customer']);

        return response()->json([
            'success' => true,
            'data' => $this->formatInvoice($invoice),
            'message' => 'Invoice updated successfully',
        ]);
    }

    public function destroy(Invoice $invoice)
    {
        if ($invoice->status !== 'pending') {
            return response()->json(['error' => 'Cannot delete invoice that is not pending'], 422);
        }

        $invoice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Invoice deleted successfully',
        ]);
    }

    public function updateStatus(Request $request, Invoice $invoice)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,paid,overdue,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $invoice->update(['status' => $request->status]);

        if ($request->status === 'paid') {
            $invoice->update(['paid_at' => now()]);
        }

        $invoice->load(['order.customer', 'customer']);

        return response()->json([
            'success' => true,
            'data' => $this->formatInvoice($invoice),
            'message' => 'Invoice status updated successfully',
        ]);
    }

    public function addPayment(Request $request, Invoice $invoice)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|in:cash,bank_transfer,check,credit_card',
            'reference' => 'nullable|string',
            'payment_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        if ($invoice->remaining_amount < $request->amount) {
            return response()->json(['error' => 'Payment amount exceeds remaining amount'], 422);
        }

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'amount' => $request->amount,
            'payment_method' => $request->method,
            'reference' => $request->reference,
            'payment_date' => $request->payment_date,
            'notes' => $request->notes,
        ]);

        // Mettre à jour le montant payé
        $invoice->increment('paid_amount', $request->amount);

        // Vérifier si la facture est entièrement payée
        if ($invoice->paid_amount >= $invoice->amount) {
            $invoice->update(['status' => 'paid', 'paid_at' => now()]);
        }

        // Notify admin/manager of payment received
        Notification::notifyRole(
            ['admin', 'manager'],
            'invoice',
            'Paiement reçu',
            "Paiement de " . number_format($request->amount, 2) . " MAD reçu pour la facture {$invoice->invoice_number}.",
            '/dashboard/invoices'
        );

        // Notify commercial
        $order = $invoice->order;
        if ($order && $order->commercial_id) {
            Notification::notifyUser(
                $order->commercial_id,
                'invoice',
                'Paiement reçu',
                "Paiement de " . number_format($request->amount, 2) . " MAD reçu pour {$invoice->invoice_number}.",
                '/dashboard/invoices'
            );
        }

        return response()->json([
            'success' => true,
            'data' => $payment,
            'message' => 'Payment added successfully',
        ]);
    }
}

