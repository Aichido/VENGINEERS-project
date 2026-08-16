<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'commercial_id',
        'status',
        'total',
        'public_id',
    ];

    protected $casts = [
        'total' => 'decimal:2',
    ];
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id')->withTrashed();
    }

    public function commercial(): BelongsTo
    {
        return $this->belongsTo(User::class, 'commercial_id')->withTrashed();
    }
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

      // Génération automatique du public_id à la création
    protected static function booted()
    {
        static::creating(function ($order) {
            $order->public_id = self::generatePublicId();
        });
    }
 
    public static function generatePublicId(): string
    {
        do {
            $publicId = '#VEN-ORD-' . strtoupper(Str::random(8));
        } while (self::where('public_id', $publicId)->exists());
 
        return $publicId;
    }
 
    // Permet le route-model binding directement sur public_id :
    // Route::get('/client/orders/{order}', ...) résoudra {order}
    // via public_id au lieu de l'id numérique.
    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

}