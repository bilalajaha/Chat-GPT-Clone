<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    /**
     * Display a listing of the user's chats.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $chats = $user->chats()
            ->with(['latestMessage'])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $chats,
        ]);
    }

    /**
     * Store a newly created chat.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $chat = Chat::create([
            'user_id' => $request->user()->id,
            'title' => $request->title ?? 'New Chat',
            'description' => $request->description,
            'settings' => $request->settings,
        ]);

        $chat->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Chat created successfully',
            'data' => $chat,
        ], 201);
    }

    /**
     * Display the specified chat with messages.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $chat = $user->chats()
            ->with(['messages' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $chat,
        ]);
    }

    /**
     * Update the specified chat.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'settings' => 'nullable|array',
            'is_archived' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $chat = $user->chats()->findOrFail($id);

        $chat->update($request->only(['title', 'description', 'settings', 'is_archived']));

        return response()->json([
            'success' => true,
            'message' => 'Chat updated successfully',
            'data' => $chat,
        ]);
    }

    /**
     * Remove the specified chat.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $chat = $user->chats()->findOrFail($id);

        $chat->delete();

        return response()->json([
            'success' => true,
            'message' => 'Chat deleted successfully',
        ]);
    }

    /**
     * Archive a chat.
     */
    public function archive(Request $request, string $id)
    {
        $user = $request->user();
        $chat = $user->chats()->findOrFail($id);

        $chat->update(['is_archived' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Chat archived successfully',
            'data' => $chat,
        ]);
    }

    /**
     * Unarchive a chat.
     */
    public function unarchive(Request $request, string $id)
    {
        $user = $request->user();
        $chat = $user->chats()->findOrFail($id);

        $chat->update(['is_archived' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Chat unarchived successfully',
            'data' => $chat,
        ]);
    }

    /**
     * Get archived chats.
     */
    public function archived(Request $request)
    {
        $user = $request->user();
        $chats = $user->archivedChats()
            ->with(['latestMessage'])
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $chats,
        ]);
    }
}
