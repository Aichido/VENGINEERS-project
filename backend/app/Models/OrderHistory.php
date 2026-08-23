<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class OrderHistory extends Model
{
    const UPDATED_AT = null;

    const CREATED_AT = 'timestamp';

    protected $connection = 'mongodb';

    protected $collection = 'order_history';

    protected $fillable = [
        'order_id',
        'status_from',
        'status_to',
        'changed_by',
    ];
}
