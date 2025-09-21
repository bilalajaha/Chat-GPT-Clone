<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->chat = Chat::factory()->create(['user_id' => $this->user->id]);
        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    public function test_user_can_get_messages_from_chat()
    {
        Message::factory()->count(3)->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/chats/{$this->chat->id}/messages");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'data' => [
                            '*' => [
                                'id',
                                'role',
                                'content',
                                'metadata',
                                'is_edited',
                                'edited_at',
                                'created_at',
                                'updated_at',
                            ],
                        ],
                        'current_page',
                        'last_page',
                        'per_page',
                        'total',
                    ],
                ]);

        $this->assertEquals(3, $response->json('data.total'));
    }

    public function test_user_can_create_message()
    {
        $messageData = [
            'content' => 'Hello, how are you?',
            'role' => 'user',
            'metadata' => [
                'tokens' => 10,
                'model' => 'gemini-pro',
            ],
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/chats/{$this->chat->id}/messages", $messageData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'id',
                        'role',
                        'content',
                        'metadata',
                        'created_at',
                        'updated_at',
                    ],
                ]);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'content' => 'Hello, how are you?',
            'role' => 'user',
        ]);
    }

    public function test_user_can_get_specific_message()
    {
        $message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/chats/{$this->chat->id}/messages/{$message->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'id' => $message->id,
                        'content' => $message->content,
                        'role' => $message->role,
                    ],
                ]);
    }

    public function test_user_can_update_message()
    {
        $message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
        ]);

        $updateData = [
            'content' => 'Updated message content',
            'metadata' => [
                'tokens' => 15,
                'model' => 'gemini-pro',
            ],
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson("/api/chats/{$this->chat->id}/messages/{$message->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'content' => 'Updated message content',
                        'is_edited' => true,
                    ],
                ]);

        $this->assertDatabaseHas('messages', [
            'id' => $message->id,
            'content' => 'Updated message content',
            'is_edited' => true,
        ]);
    }

    public function test_user_can_delete_message()
    {
        $message = Message::factory()->create([
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("/api/chats/{$this->chat->id}/messages/{$message->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Message deleted successfully',
                ]);

        $this->assertDatabaseMissing('messages', [
            'id' => $message->id,
        ]);
    }

    public function test_user_can_send_message_with_ai_response()
    {
        $messageData = [
            'content' => 'Hello, how are you?',
            'model' => 'gemini-pro',
            'temperature' => 0.7,
            'max_tokens' => 1000,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/chats/{$this->chat->id}/send", $messageData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => [
                        'user_message' => [
                            'id',
                            'content',
                            'role',
                            'created_at',
                        ],
                        'ai_response' => [
                            'id',
                            'content',
                            'role',
                            'created_at',
                        ],
                    ],
                ]);

        // Check that both messages were created
        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'content' => 'Hello, how are you?',
            'role' => 'user',
        ]);

        $this->assertDatabaseHas('messages', [
            'chat_id' => $this->chat->id,
            'user_id' => $this->user->id,
            'role' => 'assistant',
        ]);
    }

    public function test_user_cannot_access_messages_from_other_users_chats()
    {
        $otherUser = User::factory()->create();
        $otherChat = Chat::factory()->create(['user_id' => $otherUser->id]);
        $message = Message::factory()->create([
            'chat_id' => $otherChat->id,
            'user_id' => $otherUser->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("/api/chats/{$otherChat->id}/messages/{$message->id}");

        $response->assertStatus(404);
    }

    public function test_user_cannot_update_messages_from_other_users_chats()
    {
        $otherUser = User::factory()->create();
        $otherChat = Chat::factory()->create(['user_id' => $otherUser->id]);
        $message = Message::factory()->create([
            'chat_id' => $otherChat->id,
            'user_id' => $otherUser->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson("/api/chats/{$otherChat->id}/messages/{$message->id}", [
            'content' => 'Hacked message',
        ]);

        $response->assertStatus(404);
    }

    public function test_user_cannot_delete_messages_from_other_users_chats()
    {
        $otherUser = User::factory()->create();
        $otherChat = Chat::factory()->create(['user_id' => $otherUser->id]);
        $message = Message::factory()->create([
            'chat_id' => $otherChat->id,
            'user_id' => $otherUser->id,
        ]);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("/api/chats/{$otherChat->id}/messages/{$message->id}");

        $response->assertStatus(404);
    }

    public function test_message_creation_requires_authentication()
    {
        $messageData = [
            'content' => 'Hello, how are you?',
            'role' => 'user',
        ];

        $response = $this->postJson("/api/chats/{$this->chat->id}/messages", $messageData);

        $response->assertStatus(401);
    }

    public function test_message_creation_validates_required_fields()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/chats/{$this->chat->id}/messages", []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['content', 'role']);
    }

    public function test_message_role_validation()
    {
        $messageData = [
            'content' => 'Hello, how are you?',
            'role' => 'invalid_role',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/chats/{$this->chat->id}/messages", $messageData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['role']);
    }

    public function test_send_message_requires_content()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson("/api/chats/{$this->chat->id}/send", []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['content']);
    }
}
