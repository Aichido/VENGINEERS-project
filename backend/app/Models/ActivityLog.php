<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class ActivityLog extends Model
{
    const UPDATED_AT = null;

    const CREATED_AT = 'timestamp';

    protected $connection = 'mongodb';

    protected $collection = 'activity_logs';

    protected $fillable = [
        'user_id',
        'action',
        'entity',
        'entity_id',
        'meta',
        'ip',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
