<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Intervention extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'technicien_id',
        'titre',
        'description',
        'equipement',     // nouveau
        'statut',
        'priorite',
        'date_souhaitee',
        'public_id',      // nouveau
    ];

    protected $casts = [
        'date_souhaitee' => 'date',
    ];

    // Génération automatique du public_id à la création
    protected static function booted()
    {
        static::creating(function ($intervention) {
            $intervention->public_id = self::generatePublicId();
        });
    }

    public static function generatePublicId(): string
    {
        do {
            $publicId = '#VEN-INT-' . strtoupper(Str::random(8));
        } while (self::where('public_id', $publicId)->exists());

        return $publicId;
    }

   public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id')->withTrashed();
    }

    public function technicien(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technicien_id')->withTrashed();
    }
    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function reports(): HasMany
    {
        return $this->hasMany(InterventionReport::class);
    }
}