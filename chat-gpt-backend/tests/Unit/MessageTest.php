<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_message_belongs_to_chat()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        $this->assertEquals($chat->id, $message->chat->id);
        $this->assertInstanceOf(Chat::class, $message->chat);
    }

    public function test_message_belongs_to_user()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        $this->assertEquals($user->id, $message->user->id);
        $this->assertInstanceOf(User::class, $message->user);
    }

    public function test_message_scope_user_messages()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        
        $userMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'role' => 'user'
        ]);
        
        $assistantMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'role' => 'assistant'
        ]);

        $userMessages = Message::userMessages()->get();

        $this->assertTrue($userMessages->contains($userMessage));
        $this->assertFalse($userMessages->contains($assistantMessage));
    }

    public function test_message_scope_assistant_messages()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        
        $userMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'role' => 'user'
        ]);
        
        $assistantMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'role' => 'assistant'
        ]);

        $assistantMessages = Message::assistantMessages()->get();

        $this->assertFalse($assistantMessages->contains($userMessage));
        $this->assertTrue($assistantMessages->contains($assistantMessage));
    }

    public function test_message_scope_system_messages()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        
        $userMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'role' => 'user'
        ]);
        
        $systemMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'role' => 'system'
        ]);

        $systemMessages = Message::systemMessages()->get();

        $this->assertFalse($systemMessages->contains($userMessage));
        $this->assertTrue($systemMessages->contains($systemMessage));
    }

    public function test_message_metadata_is_cast_to_array()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        $metadata = ['tokens' => 100, 'model' => 'gemini-pro'];
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'metadata' => $metadata
        ]);

        $this->assertIsArray($message->metadata);
        $this->assertEquals($metadata, $message->metadata);
    }

    public function test_message_is_edited_is_cast_to_boolean()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'is_edited' => true
        ]);

        $this->assertTrue($message->is_edited);
        $this->assertIsBool($message->is_edited);
    }

    public function test_message_edited_at_is_cast_to_datetime()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        $editedAt = now();
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'edited_at' => $editedAt
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $message->edited_at);
        $this->assertEquals($editedAt->format('Y-m-d H:i:s'), $message->edited_at->format('Y-m-d H:i:s'));
    }

    public function test_message_role_validation()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);

        // Test valid roles
        $validRoles = ['user', 'assistant', 'system'];
        foreach ($validRoles as $role) {
            $message = Message::factory()->create([
                'chat_id' => $chat->id,
                'user_id' => $user->id,
                'role' => $role
            ]);
            $this->assertEquals($role, $message->role);
        }
    }
}
