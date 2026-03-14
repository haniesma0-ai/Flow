<?php
// app/Http/Controllers/Api/TaskController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::with(['createdBy', 'assignedTo', 'order']);

        // Filtrage par statut
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtrage par priorité
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filtrage par utilisateur assigné
        if ($request->has('assigned_to_id')) {
            $query->where('assigned_to_id', $request->assigned_to_id);
        }

        // Filtrage par créateur
        if ($request->has('created_by_id')) {
            $query->where('created_by_id', $request->created_by_id);
        }

        // Recherche par titre ou description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tasks = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:todo,in_progress,done,cancelled',
            'priority' => 'required|in:low,medium,high,urgent',
            'assigned_to_id' => 'nullable|exists:users,id',
            'order_id' => 'nullable|exists:orders,id',
            'due_date' => 'nullable|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $task = Task::create([
            'title' => $request->title,
            'description' => $request->description,
            'status' => $request->status ?? 'todo',
            'priority' => $request->priority,
            'created_by_id' => auth()->id(),
            'assigned_to_id' => $request->assigned_to_id,
            'order_id' => $request->order_id,
            'due_date' => $request->due_date,
        ]);

        return response()->json([
            'success' => true,
            'data' => $task->load(['createdBy', 'assignedTo', 'order']),
            'message' => 'Task created successfully',
        ], 201);
    }

    public function show(Task $task)
    {
        return response()->json([
            'success' => true,
            'data' => $task->load(['createdBy', 'assignedTo', 'order']),
        ]);
    }

    public function update(Request $request, Task $task)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:todo,in_progress,done,cancelled',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'assigned_to_id' => 'nullable|exists:users,id',
            'order_id' => 'nullable|exists:orders,id',
            'due_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $task->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $task->load(['createdBy', 'assignedTo', 'order']),
            'message' => 'Task updated successfully',
        ]);
    }

    public function destroy(Task $task)
    {
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }

    public function updateStatus(Request $request, Task $task)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:todo,in_progress,done,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $task->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'data' => $task,
            'message' => 'Task status updated successfully',
        ]);
    }
}

