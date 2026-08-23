<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class LoginAudit extends Model
{
    const UPDATED_AT = null;

    const CREATED_AT = 'timestamp';

    protected $connection = 'mongodb';

    protected $collection = 'login_audit';

    /**
     * action: login | logout | register | access_denied
     */
    protected $fillable = [
        'user_id',
        'action',
        'ip',
        'user_agent',
        'success',
        'reason',
    ];

    protected $casts = [
        'success' => 'boolean',
    ];
}
