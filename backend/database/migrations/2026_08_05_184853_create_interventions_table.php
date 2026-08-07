<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interventions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('technicien_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('titre');
            $table->text('description');
            $table->enum('statut', ['nouvelle', 'assignee', 'en_cours', 'terminee'])
                  ->default('nouvelle');
            $table->enum('priorite', ['basse', 'normale', 'haute', 'urgente'])
                  ->default('normale');
            $table->date('date_souhaitee')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};