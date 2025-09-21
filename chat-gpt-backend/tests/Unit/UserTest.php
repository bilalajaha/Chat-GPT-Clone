<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Chat;
use App\Models\Message;
use App\Models\UserPreference;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_have_chats()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($user->chats->contains($chat));
        $this->assertEquals(1, $user->chats->count());
    }

    public function test_user_can_have_messages()
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        $message = Message::factory()->create([
            'user_id' => $user->id,
            'chat_id' => $chat->id
        ]);

        $this->assertTrue($user->messages->contains($message));
        $this->assertEquals(1, $user->messages->count());
    }

    public function test_user_can_have_preferences()
    {
        $user = User::factory()->create();
        $preferences = UserPreference::factory()->create(['user_id' => $user->id]);

        $this->assertNotNull($user->preferences);
        $this->assertEquals($preferences->id, $user->preferences->id);
    }

    public function test_user_can_have_active_chats()
    {
        $user = User::factory()->create();
        $activeChat = Chat::factory()->create(['user_id' => $user->id, 'is_archived' => false]);
        $archivedChat = Chat::factory()->create(['user_id' => $user->id, 'is_archived' => true]);

        $activeChats = $user->activeChats;

        $this->assertTrue($activeChats->contains($activeChat));
        $this->assertFalse($activeChats->contains($archivedChat));
        $this->assertEquals(1, $activeChats->count());
    }

    public function test_user_can_have_archived_chats()
    {
        $user = User::factory()->create();
        $activeChat = Chat::factory()->create(['user_id' => $user->id, 'is_archived' => false]);
        $archivedChat = Chat::factory()->create(['user_id' => $user->id, 'is_archived' => true]);

        $archivedChats = $user->archivedChats;

        $this->assertFalse($archivedChats->contains($activeChat));
        $this->assertTrue($archivedChats->contains($archivedChat));
        $this->assertEquals(1, $archivedChats->count());
    }

    public function test_user_can_create_api_tokens()
    {
        $user = User::factory()->create();
        
        $token = $user->createToken('test-token');

        $this->assertNotNull($token->plainTextToken);
        $this->assertEquals(1, $user->tokens()->count());
    }

    public function test_user_can_revoke_tokens()
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token');
        
        $user->tokens()->delete();

        $this->assertEquals(0, $user->tokens()->count());
    }
}
