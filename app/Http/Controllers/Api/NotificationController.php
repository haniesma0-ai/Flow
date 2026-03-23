<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Get the authenticated user's notifications with pagination.
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 20);
        $perPage = min($perPage, 100); // Cap at 100

        $notifications = Notification::where('user_id', $request->user()->id)
            ->select('id', 'type', 'title', 'message', 'link', 'read', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => collect($notifications->items())->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'message' => $n->message,
                'link' => $n->link,
                'read' => $n->read,
                'createdAt' => $n->created_at->toISOString(),
            ]),
            'pagination' => [
                'total' => $notifications->total(),
                'per_page' => $notifications->perPage(),
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'has_more' => $notifications->hasMorePages(),
            ],
        ]);
    }

    /**
     * Get the unread count for the authenticated user.
     */
    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update(['read' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->unread()
            ->update(['read' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Delete a single notification.
     */
    public function destroy(Request $request, $id)
    {
        Notification::where('user_id', $request->user()->id)
            ->findOrFail($id)
            ->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Clear all notifications.
     */
    public function clearAll(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->delete();

        return response()->json(['success' => true]);
    }
}
