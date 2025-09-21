<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    public function test_user_can_get_chats()
    {
        Chat::factory()->count(3)->create(['user_id' => $this->user->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/chats');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'title',
                            'description',
                            'settings',
                            'is_archived',
                            'last_message_at',
                            'created_at',
                            'updated_at',
                        ],
                    ],
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ]);

        $this->assertEquals(3, $response->json('total'));
    }

    public function test_user_can_create_chat()
    {
        $chatData = [
            'title' => 'New Chat',
            'description' => 'A new conversation',
            'settings' => [
                'model' => 'gemini-pro',
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ],
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/chats', $chatData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'id',
                    'title',
                    'description',
                    'settings',
                    'is_archived',
                    'created_at',
                    'updated_at',
                ]);

        $this->assertDatabaseHas('chats', [
            'user_id' => $this->user->id,
            'title' => 'New Chat',
            'description' => 'A new conversation',
        ]);
    }

    public function test_user_can_get_specific_chat()
    {
        $chat = Chat::factory()->create(['user_id' => $this->user->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/chats/{$chat->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'id' => $chat->id,
                    'title' => $chat->title,
                ]);
    }

    public function test_user_can_update_chat()
    {
        $chat = Chat::factory()->create(['user_id' => $this->user->id]);
        $updateData = [
            'title' => 'Updated Chat Title',
            'description' => 'Updated description',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson("/api/chats/{$chat->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'title' => 'Updated Chat Title',
                    'description' => 'Updated description',
                ]);

        $this->assertDatabaseHas('chats', [
            'id' => $chat->id,
            'title' => 'Updated Chat Title',
            'description' => 'Updated description',
        ]);
    }

    public function test_user_can_delete_chat()
    {
        $chat = Chat::factory()->create(['user_id' => $this->user->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("/api/chats/{$chat->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Chat deleted successfully',
                ]);

        $this->assertDatabaseMissing('chats', [
            'id' => $chat->id,
        ]);
    }

    public function test_user_can_archive_chat()
    {
        $chat = Chat::factory()->create(['user_id' => $this->user->id, 'is_archived' => false]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/chats/{$chat->id}/archive");

        $response->assertStatus(200)
                ->assertJson([
                    'is_archived' => true,
                ]);

        $this->assertDatabaseHas('chats', [
            'id' => $chat->id,
            'is_archived' => true,
        ]);
    }

    public function test_user_can_unarchive_chat()
    {
        $chat = Chat::factory()->create(['user_id' => $this->user->id, 'is_archived' => true]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/chats/{$chat->id}/unarchive");

        $response->assertStatus(200)
                ->assertJson([
                    'is_archived' => false,
                ]);

        $this->assertDatabaseHas('chats', [
            'id' => $chat->id,
            'is_archived' => false,
        ]);
    }

    public function test_user_can_get_archived_chats()
    {
        Chat::factory()->count(2)->create(['user_id' => $this->user->id, 'is_archived' => true]);
        Chat::factory()->count(3)->create(['user_id' => $this->user->id, 'is_archived' => false]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson('/api/chats-archived');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'title',
                            'is_archived',
                        ],
                    ],
                ]);

        $this->assertEquals(2, $response->json('total'));
    }

    public function test_user_cannot_access_other_users_chats()
    {
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/chats/{$chat->id}");

        $response->assertStatus(403);
    }

    public function test_user_cannot_update_other_users_chats()
    {
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson("/api/chats/{$chat->id}", [
            'title' => 'Hacked Title',
        ]);

        $response->assertStatus(403);
    }

    public function test_user_cannot_delete_other_users_chats()
    {
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("/api/chats/{$chat->id}");

        $response->assertStatus(403);
    }

    public function test_chat_creation_requires_authentication()
    {
        $chatData = [
            'title' => 'New Chat',
            'description' => 'A new conversation',
        ];

        $response = $this->postJson('/api/chats', $chatData);

        $response->assertStatus(401);
    }

    public function test_chat_creation_validates_required_fields()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson('/api/chats', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['title']);
    }
}
