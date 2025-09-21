<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserPreference;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Get user profile with preferences.
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        $user->load('preferences');

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Update user profile.
     */
    public function updateProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $request->user()->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $user->update($request->only(['name', 'email']));

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user,
        ]);
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
            ], 400);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Get user preferences.
     */
    public function preferences(Request $request)
    {
        $user = $request->user();
        $preferences = $user->preferences;

        if (!$preferences) {
            $preferences = UserPreference::createDefaults($user->id);
        }

        return response()->json([
            'success' => true,
            'data' => $preferences,
        ]);
    }

    /**
     * Update user preferences.
     */
    public function updatePreferences(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'theme' => 'nullable|in:dark,light',
            'language' => 'nullable|string|max:10',
            'default_model' => 'nullable|string|max:50',
            'temperature' => 'nullable|numeric|between:0,2',
            'max_tokens' => 'nullable|integer|min:1|max:4000',
            'auto_save' => 'nullable|boolean',
            'notifications' => 'nullable|boolean',
            'api_settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $preferences = $user->preferences;

        if (!$preferences) {
            $preferences = UserPreference::createDefaults($user->id);
        }

        $preferences->update($request->only([
            'theme',
            'language',
            'default_model',
            'temperature',
            'max_tokens',
            'auto_save',
            'notifications',
            'api_settings',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated successfully',
            'data' => $preferences,
        ]);
    }

    /**
     * Get user statistics.
     */
    public function statistics(Request $request)
    {
        $user = $request->user();

        $stats = [
            'total_chats' => $user->chats()->count(),
            'active_chats' => $user->activeChats()->count(),
            'archived_chats' => $user->archivedChats()->count(),
            'total_messages' => $user->messages()->count(),
            'user_messages' => $user->messages()->userMessages()->count(),
            'assistant_messages' => $user->messages()->assistantMessages()->count(),
            'total_tokens_used' => $user->messages()
                ->whereNotNull('metadata->tokens_used')
                ->sum('metadata->tokens_used'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Delete user account.
     */
    public function deleteAccount(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password is incorrect',
            ], 400);
        }

        // Delete all user data (cascade will handle related records)
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully',
        ]);
    }

    /**
     * Migrate data from localStorage to database.
     */
    public function migrateData(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'chats' => 'nullable|array',
            'preferences' => 'nullable|array',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $migratedChats = 0;
        $errors = [];

        try {
            // Migrate chats
            if ($request->has('chats') && is_array($request->chats)) {
                foreach ($request->chats as $chatData) {
                    try {
                        $chat = $user->chats()->create([
                            'title' => $chatData['title'] ?? 'Migrated Chat',
                            'description' => $chatData['description'] ?? null,
                            'settings' => $chatData['settings'] ?? null,
                        ]);

                        // Migrate messages
                        if (isset($chatData['messages']) && is_array($chatData['messages'])) {
                            foreach ($chatData['messages'] as $messageData) {
                                $chat->messages()->create([
                                    'user_id' => $user->id,
                                    'content' => $messageData['content'],
                                    'role' => $messageData['role'] ?? 'user',
                                    'metadata' => $messageData['metadata'] ?? null,
                                ]);
                            }
                        }

                        $migratedChats++;
                    } catch (\Exception $e) {
                        $errors[] = "Failed to migrate chat: " . $e->getMessage();
                    }
                }
            }

            // Migrate preferences
            if ($request->has('preferences')) {
                $preferences = $user->preferences;
                if (!$preferences) {
                    $preferences = UserPreference::createDefaults($user->id);
                }

                $preferences->update([
                    'theme' => $request->preferences['theme'] ?? $preferences->theme,
                    'default_model' => $request->preferences['defaultModel'] ?? $preferences->default_model,
                    'temperature' => $request->preferences['temperature'] ?? $preferences->temperature,
                    'max_tokens' => $request->preferences['maxTokens'] ?? $preferences->max_tokens,
                    'auto_save' => $request->preferences['autoSave'] ?? $preferences->auto_save,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data migrated successfully',
                'data' => [
                    'migrated_chats' => $migratedChats,
                    'errors' => $errors,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Migration failed: ' . $e->getMessage(),
                'errors' => $errors,
            ], 500);
        }
    }

    /**
     * Export user data.
     */
    public function exportData(Request $request)
    {
        $user = $request->user();

        try {
            $chats = $user->chats()->with('messages')->get();
            $preferences = $user->preferences;
            $statistics = [
                'total_chats' => $user->chats()->count(),
                'active_chats' => $user->activeChats()->count(),
                'archived_chats' => $user->archivedChats()->count(),
                'total_messages' => $user->messages()->count(),
                'user_messages' => $user->messages()->userMessages()->count(),
                'assistant_messages' => $user->messages()->assistantMessages()->count(),
                'total_tokens_used' => $user->messages()
                    ->whereNotNull('metadata->tokens_used')
                    ->sum('metadata->tokens_used'),
            ];

            $exportData = [
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at,
                ],
                'chats' => $chats->map(function ($chat) {
                    return [
                        'id' => $chat->id,
                        'title' => $chat->title,
                        'description' => $chat->description,
                        'settings' => $chat->settings,
                        'is_archived' => $chat->is_archived,
                        'created_at' => $chat->created_at,
                        'updated_at' => $chat->updated_at,
                        'messages' => $chat->messages->map(function ($message) {
                            return [
                                'id' => $message->id,
                                'content' => $message->content,
                                'role' => $message->role,
                                'metadata' => $message->metadata,
                                'is_edited' => $message->is_edited,
                                'created_at' => $message->created_at,
                                'updated_at' => $message->updated_at,
                            ];
                        }),
                    ];
                }),
                'preferences' => $preferences ? [
                    'theme' => $preferences->theme,
                    'language' => $preferences->language,
                    'default_model' => $preferences->default_model,
                    'temperature' => $preferences->temperature,
                    'max_tokens' => $preferences->max_tokens,
                    'auto_save' => $preferences->auto_save,
                    'notifications' => $preferences->notifications,
                    'api_settings' => $preferences->api_settings,
                ] : null,
                'statistics' => $statistics,
                'export_date' => now()->toISOString(),
                'version' => '1.0',
            ];

            return response()->json([
                'success' => true,
                'data' => $exportData,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Export failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import user data.
     */
    public function importData(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'chats' => 'nullable|array',
            'preferences' => 'nullable|array',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $importedChats = 0;
        $errors = [];

        try {
            // Import chats
            if ($request->has('chats') && is_array($request->chats)) {
                foreach ($request->chats as $chatData) {
                    try {
                        $chat = $user->chats()->create([
                            'title' => $chatData['title'] ?? 'Imported Chat',
                            'description' => $chatData['description'] ?? null,
                            'settings' => $chatData['settings'] ?? null,
                            'is_archived' => $chatData['is_archived'] ?? false,
                        ]);

                        // Import messages
                        if (isset($chatData['messages']) && is_array($chatData['messages'])) {
                            foreach ($chatData['messages'] as $messageData) {
                                $chat->messages()->create([
                                    'user_id' => $user->id,
                                    'content' => $messageData['content'],
                                    'role' => $messageData['role'] ?? 'user',
                                    'metadata' => $messageData['metadata'] ?? null,
                                    'is_edited' => $messageData['is_edited'] ?? false,
                                ]);
                            }
                        }

                        $importedChats++;
                    } catch (\Exception $e) {
                        $errors[] = "Failed to import chat: " . $e->getMessage();
                    }
                }
            }

            // Import preferences
            if ($request->has('preferences')) {
                $preferences = $user->preferences;
                if (!$preferences) {
                    $preferences = UserPreference::createDefaults($user->id);
                }

                $preferences->update([
                    'theme' => $request->preferences['theme'] ?? $preferences->theme,
                    'language' => $request->preferences['language'] ?? $preferences->language,
                    'default_model' => $request->preferences['default_model'] ?? $preferences->default_model,
                    'temperature' => $request->preferences['temperature'] ?? $preferences->temperature,
                    'max_tokens' => $request->preferences['max_tokens'] ?? $preferences->max_tokens,
                    'auto_save' => $request->preferences['auto_save'] ?? $preferences->auto_save,
                    'notifications' => $request->preferences['notifications'] ?? $preferences->notifications,
                    'api_settings' => $request->preferences['api_settings'] ?? $preferences->api_settings,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data imported successfully',
                'data' => [
                    'imported_chats' => $importedChats,
                    'errors' => $errors,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
                'errors' => $errors,
            ], 500);
        }
    }
}
