<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_belongs_to_user()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);

        $this->assertEquals($user->id, $chat->user->id);
        $this->assertInstanceOf(User::class, $chat->user);
    }

    public function test_chat_can_have_messages()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        $message = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id
        ]);

        $this->assertTrue($chat->messages->contains($message));
        $this->assertEquals(1, $chat->messages->count());
    }

    public function test_chat_can_have_latest_message()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        
        $firstMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'created_at' => now()->subHour()
        ]);
        
        $latestMessage = Message::factory()->create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'created_at' => now()
        ]);

        $this->assertEquals($latestMessage->id, $chat->latestMessage->first()->id);
    }

    public function test_chat_scope_active()
    {
        $user = User::factory()->create();
        $activeChat = Chat::factory()->create(['user_id' => $user->id, 'is_archived' => false]);
        $archivedChat = Chat::factory()->create(['user_id' => $user->id, 'is_archived' => true]);

        $activeChats = Chat::active()->get();

        $this->assertTrue($activeChats->contains($activeChat));
        $this->assertFalse($activeChats->contains($archivedChat));
    }

    public function test_chat_scope_archived()
    {
        $user = User::factory()->create();
        $activeChat = Chat::factory()->create(['user_id' => $user->id, 'is_archived' => false]);
        $archivedChat = Chat::factory()->create(['user_id' => $user->id, 'is_archived' => true]);

        $archivedChats = Chat::archived()->get();

        $this->assertFalse($archivedChats->contains($activeChat));
        $this->assertTrue($archivedChats->contains($archivedChat));
    }

    public function test_chat_settings_are_cast_to_array()
    {
        $user = User::factory()->create();
        $settings = ['model' => 'gemini-pro', 'temperature' => 0.7];
        $chat = Chat::factory()->create([
            'user_id' => $user->id,
            'settings' => $settings
        ]);

        $this->assertIsArray($chat->settings);
        $this->assertEquals($settings, $chat->settings);
    }

    public function test_chat_is_archived_is_cast_to_boolean()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create([
            'user_id' => $user->id,
            'is_archived' => true
        ]);

        $this->assertTrue($chat->is_archived);
        $this->assertIsBool($chat->is_archived);
    }

    public function test_chat_last_message_at_is_cast_to_datetime()
    {
        $user = User::factory()->create();
        $lastMessageAt = now();
        $chat = Chat::factory()->create([
            'user_id' => $user->id,
            'last_message_at' => $lastMessageAt
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $chat->last_message_at);
        $this->assertEquals($lastMessageAt->format('Y-m-d H:i:s'), $chat->last_message_at->format('Y-m-d H:i:s'));
    }
}
