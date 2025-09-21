<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserPreference>
 */
class UserPreferenceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'theme' => $this->faker->randomElement(['dark', 'light']),
            'language' => $this->faker->randomElement(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']),
            'default_model' => $this->faker->randomElement(['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash']),
            'temperature' => $this->faker->randomFloat(2, 0.1, 1.0),
            'max_tokens' => $this->faker->numberBetween(100, 4000),
            'auto_save' => $this->faker->boolean(80), // 80% chance of being true
            'notifications' => $this->faker->boolean(70), // 70% chance of being true
            'api_settings' => [
                'gemini_api_key' => $this->faker->optional(0.3)->regexify('[A-Za-z0-9]{32}'),
                'openai_api_key' => $this->faker->optional(0.1)->regexify('sk-[A-Za-z0-9]{48}'),
                'anthropic_api_key' => $this->faker->optional(0.1)->regexify('sk-ant-[A-Za-z0-9]{32}'),
            ],
        ];
    }

    /**
     * Indicate that the user prefers dark theme.
     */
    public function darkTheme(): static
    {
        return $this->state(fn (array $attributes) => [
            'theme' => 'dark',
        ]);
    }

    /**
     * Indicate that the user prefers light theme.
     */
    public function lightTheme(): static
    {
        return $this->state(fn (array $attributes) => [
            'theme' => 'light',
        ]);
    }

    /**
     * Indicate that the user has a specific language preference.
     */
    public function withLanguage(string $language): static
    {
        return $this->state(fn (array $attributes) => [
            'language' => $language,
        ]);
    }

    /**
     * Indicate that the user has a specific model preference.
     */
    public function withModel(string $model): static
    {
        return $this->state(fn (array $attributes) => [
            'default_model' => $model,
        ]);
    }

    /**
     * Indicate that the user has specific temperature preference.
     */
    public function withTemperature(float $temperature): static
    {
        return $this->state(fn (array $attributes) => [
            'temperature' => $temperature,
        ]);
    }

    /**
     * Indicate that the user has specific max tokens preference.
     */
    public function withMaxTokens(int $maxTokens): static
    {
        return $this->state(fn (array $attributes) => [
            'max_tokens' => $maxTokens,
        ]);
    }

    /**
     * Indicate that auto-save is enabled.
     */
    public function withAutoSave(): static
    {
        return $this->state(fn (array $attributes) => [
            'auto_save' => true,
        ]);
    }

    /**
     * Indicate that auto-save is disabled.
     */
    public function withoutAutoSave(): static
    {
        return $this->state(fn (array $attributes) => [
            'auto_save' => false,
        ]);
    }

    /**
     * Indicate that notifications are enabled.
     */
    public function withNotifications(): static
    {
        return $this->state(fn (array $attributes) => [
            'notifications' => true,
        ]);
    }

    /**
     * Indicate that notifications are disabled.
     */
    public function withoutNotifications(): static
    {
        return $this->state(fn (array $attributes) => [
            'notifications' => false,
        ]);
    }

    /**
     * Indicate that the user has specific API settings.
     */
    public function withApiSettings(array $apiSettings): static
    {
        return $this->state(fn (array $attributes) => [
            'api_settings' => array_merge($attributes['api_settings'] ?? [], $apiSettings),
        ]);
    }
}
