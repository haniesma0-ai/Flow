<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = [
        'name',
        'company',
        'email',
        'phone',
        'message',
        'email_sent',
        'read',
    ];

    protected $casts = [
        'email_sent' => 'boolean',
        'read' => 'boolean',
    ];
}
