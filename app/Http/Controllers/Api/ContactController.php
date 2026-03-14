<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:30',
            'message' => 'required|string|min:10|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->only(['name', 'company', 'email', 'phone', 'message']);

        // Save to database first so the message is never lost
        $contactMessage = ContactMessage::create($data);

        try {
            // Send email to company
            Mail::raw(
                "Nouveau message de contact depuis le site FoxPetroleum\n\n" .
                "Nom : {$data['name']}\n" .
                "Entreprise : " . ($data['company'] ?? 'Non spécifiée') . "\n" .
                "Email : {$data['email']}\n" .
                "Téléphone : " . ($data['phone'] ?? 'Non spécifié') . "\n\n" .
                "Message :\n{$data['message']}\n",
                function ($mail) use ($data) {
                    $mail->to(config('mail.from.address', 'contactus@fox-petroleum.com'))
                        ->replyTo($data['email'], $data['name'])
                        ->subject('Nouveau contact - ' . $data['name'] . ($data['company'] ? ' (' . $data['company'] . ')' : ''));
                }
            );

            // Send confirmation to user
            Mail::raw(
                "Bonjour {$data['name']},\n\n" .
                "Nous avons bien reçu votre message et nous vous en remercions.\n" .
                "Notre équipe vous contactera dans les plus brefs délais.\n\n" .
                "Cordialement,\n" .
                "L'équipe FoxPetroleum\n" .
                "contact@foxpetroleum.ma\n" .
                "+212 522 243 030",
                function ($mail) use ($data) {
                    $mail->to($data['email'], $data['name'])
                        ->subject('FoxPetroleum - Confirmation de votre message');
                }
            );

            $contactMessage->update(['email_sent' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Message envoyé avec succès',
            ]);
        } catch (\Exception $e) {
            Log::error('Contact form error: ' . $e->getMessage());

            // Email failed but message is saved in database
            return response()->json([
                'success' => true,
                'message' => 'Message reçu. Nous vous contacterons bientôt.',
            ]);
        }
    }
}
