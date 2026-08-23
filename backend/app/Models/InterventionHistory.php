<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class InterventionHistory extends Model
{
    const UPDATED_AT = null;

    const CREATED_AT = 'timestamp';

    protected $connection = 'mongodb';

    protected $collection = 'intervention_history';

    protected $fillable = [
        'intervention_id',
        'event',
        'actor',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
