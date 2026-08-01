<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::create('products', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();
        $table->decimal('price', 10, 2);
        $table->unsignedInteger('stock_qty')->default(0);
        $table->foreignId('category_id')
            ->constrained('categories')
            ->onDelete('restrict');
        $table->boolean('is_active')->default(true);
        $table->timestamps();

        $table->index(['is_active', 'category_id']);
    });
}

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};