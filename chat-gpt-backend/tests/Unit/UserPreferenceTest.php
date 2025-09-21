<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserPreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_preference_belongs_to_user()
    {
        $user = User::factory()->create();
        $preferences = UserPreference::factory()->create(['user_id' => $user->id]);

        $this->assertEquals($user->id, $preferences->user->id);
        $this->assertInstanceOf(User::class, $preferences->user);
    }

    public function test_user_preference_has_default_values()
    {
        $user = User::factory()->create();
        $preferences = UserPreference::createDefaults($user->id);

        $this->assertEquals('dark', $preferences->theme);
        $this->assertEquals('en', $preferences->language);
        $this->assertEquals('gemini-pro', $preferences->default_model);
        $this->assertEquals(0.7, $preferences->temperature);
        $this->assertEquals(1000, $preferences->max_tokens);
        $this->assertTrue($preferences->auto_save);
        $this->assertTrue($preferences->notifications);
    }

    public function test_user_preference_temperature_is_cast_to_decimal()
    {
        $user = User::factory()->create();
        $preferences = UserPreference::factory()->create([
            'user_id' => $user->id,
            'temperature' => 0.75
        ]);

        $this->assertIsFloat($preferences->temperature);
        $this->assertEquals(0.75, $preferences->temperature);
    }

    public function test_user_preference_auto_save_is_cast_to_boolean()
    {
        $user = User::factory()->create();
        $preferences = UserPreference::factory()->create([
            'user_id' => $user->id,
            'auto_save' => true
        ]);

        $this->assertTrue($preferences->auto_save);
        $this->assertIsBool($preferences->auto_save);
    }

    public function test_user_preference_notifications_is_cast_to_boolean()
    {
        $user = User::factory()->create();
        $preferences = UserPreference::factory()->create([
            'user_id' => $user->id,
            'notifications' => false
        ]);

        $this->assertFalse($preferences->notifications);
        $this->assertIsBool($preferences->notifications);
    }

    public function test_user_preference_api_settings_is_cast_to_array()
    {
        $user = User::factory()->create();
        $apiSettings = [
            'gemini_api_key' => 'test-key',
            'openai_api_key' => null,
            'anthropic_api_key' => null
        ];
        $preferences = UserPreference::factory()->create([
            'user_id' => $user->id,
            'api_settings' => $apiSettings
        ]);

        $this->assertIsArray($preferences->api_settings);
        $this->assertEquals($apiSettings, $preferences->api_settings);
    }

    public function test_user_preference_get_default_api_settings()
    {
        $user = User::factory()->create();
        $preferences = UserPreference::factory()->create(['user_id' => $user->id]);
        
        $defaultSettings = $preferences->getDefaultApiSettings();

        $this->assertIsArray($defaultSettings);
        $this->assertArrayHasKey('gemini_api_key', $defaultSettings);
        $this->assertArrayHasKey('openai_api_key', $defaultSettings);
        $this->assertArrayHasKey('anthropic_api_key', $defaultSettings);
    }

    public function test_user_preference_create_defaults_returns_instance()
    {
        $user = User::factory()->create();
        $preferences = UserPreference::createDefaults($user->id);

        $this->assertInstanceOf(UserPreference::class, $preferences);
        $this->assertEquals($user->id, $preferences->user_id);
    }

    public function test_user_preference_has_unique_user_id()
    {
        $user = User::factory()->create();
        UserPreference::factory()->create(['user_id' => $user->id]);

        // Attempting to create another preference for the same user should fail
        $this->expectException(\Illuminate\Database\QueryException::class);
        UserPreference::factory()->create(['user_id' => $user->id]);
    }

    public function test_user_preference_theme_validation()
    {
        $user = User::factory()->create();
        
        // Test valid themes
        $validThemes = ['dark', 'light'];
        foreach ($validThemes as $theme) {
            $preferences = UserPreference::factory()->create([
                'user_id' => $user->id,
                'theme' => $theme
            ]);
            $this->assertEquals($theme, $preferences->theme);
        }
    }

    public function test_user_preference_language_validation()
    {
        $user = User::factory()->create();
        
        // Test valid languages
        $validLanguages = ['en', 'es', 'fr', 'de'];
        foreach ($validLanguages as $language) {
            $preferences = UserPreference::factory()->create([
                'user_id' => $user->id,
                'language' => $language
            ]);
            $this->assertEquals($language, $preferences->language);
        }
    }

    public function test_user_preference_model_validation()
    {
        $user = User::factory()->create();
        
        // Test valid models
        $validModels = ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'];
        foreach ($validModels as $model) {
            $preferences = UserPreference::factory()->create([
                'user_id' => $user->id,
                'default_model' => $model
            ]);
            $this->assertEquals($model, $preferences->default_model);
        }
    }
}
