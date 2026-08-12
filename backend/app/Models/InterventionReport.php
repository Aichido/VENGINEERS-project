<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterventionReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'intervention_id',
        'technicien_id',
        'contenu',
        'fichier_path',
    ];

    public function intervention(): BelongsTo
    {
        return $this->belongsTo(Intervention::class);
    }

    public function technicien(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technicien_id');
    }
}