<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('intervention_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intervention_id')->constrained('interventions')->cascadeOnDelete();
            $table->foreignId('technicien_id')->constrained('users')->cascadeOnDelete();
            $table->text('contenu');
            $table->string('fichier_path')->nullable(); // chemin Storage, pas le binaire
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intervention_reports');
    }
};