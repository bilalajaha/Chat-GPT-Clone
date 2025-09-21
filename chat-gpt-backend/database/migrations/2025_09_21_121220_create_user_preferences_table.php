<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('theme')->default('dark'); // dark, light
            $table->string('language')->default('en');
            $table->string('default_model')->default('gemini-pro'); // Default AI model
            $table->decimal('temperature', 3, 2)->default(0.7); // AI response creativity
            $table->integer('max_tokens')->default(1000); // Max response length
            $table->boolean('auto_save')->default(true); // Auto-save chats
            $table->boolean('notifications')->default(true); // Enable notifications
            $table->json('api_settings')->nullable(); // Store API keys and settings
            $table->timestamps();
            
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
