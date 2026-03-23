<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'link',
        'read',
    ];

    protected $casts = [
        'read' => 'boolean',
    ];

    // ── Relations ─────────────────────────────────────────────
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ── Scopes ────────────────────────────────────────────────
    public function scopeUnread($query)
    {
        return $query->where('read', false);
    }

    // ── Helper: send notifications to users by role ───────────
    public static function notifyRole(string|array $roles, string $type, string $title, string $message, ?string $link = null): void
    {
        $roles = (array) $roles;

        $users = User::whereHas('role', function ($q) use ($roles) {
            $q->whereIn('name', $roles);
        })->where('is_active', true)->get();

        if ($users->isEmpty()) {
            return;
        }

        $now = now();
        $payload = $users->map(fn($user) => [
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
            'read' => false,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        self::insert($payload);
    }

    // ── Helper: send notification to a specific user ──────────
    public static function notifyUser(int $userId, string $type, string $title, string $message, ?string $link = null): void
    {
        self::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
        ]);
    }
}
