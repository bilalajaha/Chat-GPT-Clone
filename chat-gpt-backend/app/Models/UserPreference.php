<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    protected $fillable = [
        'user_id',
        'theme',
        'language',
        'default_model',
        'temperature',
        'max_tokens',
        'auto_save',
        'notifications',
        'api_settings',
    ];

    protected $casts = [
        'temperature' => 'decimal:2',
        'auto_save' => 'boolean',
        'notifications' => 'boolean',
        'api_settings' => 'array',
    ];

    /**
     * Get the user that owns the preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the default API settings.
     */
    public function getDefaultApiSettings(): array
    {
        return [
            'gemini_api_key' => null,
            'openai_api_key' => null,
            'anthropic_api_key' => null,
        ];
    }

    /**
     * Create default preferences for a user.
     */
    public static function createDefaults(int $userId): self
    {
        return self::create([
            'user_id' => $userId,
            'theme' => 'dark',
            'language' => 'en',
            'default_model' => 'gemini-pro',
            'temperature' => 0.7,
            'max_tokens' => 1000,
            'auto_save' => true,
            'notifications' => true,
            'api_settings' => (new self)->getDefaultApiSettings(),
        ]);
    }
}
