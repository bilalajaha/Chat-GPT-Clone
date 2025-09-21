<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    /**
     * Display messages for a specific chat.
     */
    public function index(Request $request, string $chatId)
    {
        $user = $request->user();
        $chat = $user->chats()->findOrFail($chatId);

        $messages = $chat->messages()
            ->orderBy('created_at', 'asc')
            ->paginate(50);

        return response()->json([
            'success' => true,
            'data' => $messages,
        ]);
    }

    /**
     * Store a newly created message.
     */
    public function store(Request $request, string $chatId)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:10000',
            'role' => 'required|in:user,assistant,system',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $chat = $user->chats()->findOrFail($chatId);

        $message = Message::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'content' => $request->content,
            'role' => $request->role,
            'metadata' => $request->metadata,
        ]);

        // Update chat's last_message_at timestamp
        $chat->update(['last_message_at' => now()]);

        $message->load(['chat', 'user']);

        return response()->json([
            'success' => true,
            'message' => 'Message created successfully',
            'data' => $message,
        ], 201);
    }

    /**
     * Display the specified message.
     */
    public function show(Request $request, string $chatId, string $id)
    {
        $user = $request->user();
        $chat = $user->chats()->findOrFail($chatId);

        $message = $chat->messages()->findOrFail($id);
        $message->load(['chat', 'user']);

        return response()->json([
            'success' => true,
            'data' => $message,
        ]);
    }

    /**
     * Update the specified message.
     */
    public function update(Request $request, string $chatId, string $id)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:10000',
            'metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $chat = $user->chats()->findOrFail($chatId);
        $message = $chat->messages()->findOrFail($id);

        // Only allow users to edit their own messages
        if ($message->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own messages',
            ], 403);
        }

        $message->update([
            'content' => $request->content,
            'metadata' => $request->metadata,
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message updated successfully',
            'data' => $message,
        ]);
    }

    /**
     * Remove the specified message.
     */
    public function destroy(Request $request, string $chatId, string $id)
    {
        $user = $request->user();
        $chat = $user->chats()->findOrFail($chatId);
        $message = $chat->messages()->findOrFail($id);

        // Only allow users to delete their own messages
        if ($message->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own messages',
            ], 403);
        }

        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully',
        ]);
    }

    /**
     * Send a message and get AI response (placeholder for AI integration).
     */
    public function send(Request $request, string $chatId)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:10000',
            'model' => 'nullable|string',
            'temperature' => 'nullable|numeric|between:0,2',
            'max_tokens' => 'nullable|integer|min:1|max:4000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $chat = $user->chats()->findOrFail($chatId);

        // Create user message
        $userMessage = Message::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'content' => $request->content,
            'role' => 'user',
            'metadata' => [
                'model' => $request->model ?? 'gemini-pro',
                'temperature' => $request->temperature ?? 0.7,
                'max_tokens' => $request->max_tokens ?? 1000,
            ],
        ]);

        // TODO: Integrate with AI service (Gemini, OpenAI, etc.)
        // For now, return a placeholder response
        $aiResponse = Message::create([
            'chat_id' => $chat->id,
            'user_id' => $user->id,
            'content' => 'This is a placeholder AI response. AI integration will be implemented in the next phase.',
            'role' => 'assistant',
            'metadata' => [
                'model' => $request->model ?? 'gemini-pro',
                'temperature' => $request->temperature ?? 0.7,
                'max_tokens' => $request->max_tokens ?? 1000,
                'tokens_used' => 50, // Placeholder
            ],
        ]);

        // Update chat's last_message_at timestamp
        $chat->update(['last_message_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'data' => [
                'user_message' => $userMessage,
                'ai_response' => $aiResponse,
            ],
        ], 201);
    }
}
