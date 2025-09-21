<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SearchController extends Controller
{
    /**
     * Search chats by title and description.
     */
    public function searchChats(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string|min:1|max:255',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $query = $request->input('q');
        $page = $request->input('page', 1);

        try {
            $chats = $user->chats()
                ->where(function ($q) use ($query) {
                    $q->where('title', 'LIKE', "%{$query}%")
                      ->orWhere('description', 'LIKE', "%{$query}%");
                })
                ->with(['latestMessage'])
                ->orderBy('last_message_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate(20, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $chats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search messages within a specific chat.
     */
    public function searchMessagesInChat(Request $request, string $chatId)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string|min:1|max:255',
            'page' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $query = $request->input('q');
        $page = $request->input('page', 1);

        try {
            // Verify chat belongs to user
            $chat = $user->chats()->findOrFail($chatId);

            $messages = $chat->messages()
                ->where('content', 'LIKE', "%{$query}%")
                ->orderBy('created_at', 'desc')
                ->paginate(50, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $messages,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search messages across all user's chats.
     */
    public function searchAllMessages(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string|min:1|max:255',
            'page' => 'nullable|integer|min:1',
            'role' => 'nullable|in:user,assistant,system',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $query = $request->input('q');
        $page = $request->input('page', 1);
        $role = $request->input('role');

        try {
            $messagesQuery = $user->messages()
                ->with(['chat'])
                ->where('content', 'LIKE', "%{$query}%");

            if ($role) {
                $messagesQuery->where('role', $role);
            }

            $messages = $messagesQuery
                ->orderBy('created_at', 'desc')
                ->paginate(50, ['*'], 'page', $page);

            return response()->json([
                'success' => true,
                'data' => $messages,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Search failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get search suggestions based on chat titles and recent messages.
     */
    public function getSearchSuggestions(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation errors',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $query = $request->input('q', '');

        try {
            $suggestions = [];

            // Get chat title suggestions
            if (strlen($query) > 0) {
                $chatTitles = $user->chats()
                    ->where('title', 'LIKE', "%{$query}%")
                    ->limit(5)
                    ->pluck('title')
                    ->toArray();

                $suggestions = array_merge($suggestions, $chatTitles);
            }

            // Get recent chat titles if no query
            if (strlen($query) === 0) {
                $recentChats = $user->chats()
                    ->orderBy('last_message_at', 'desc')
                    ->limit(5)
                    ->pluck('title')
                    ->toArray();

                $suggestions = array_merge($suggestions, $recentChats);
            }

            // Remove duplicates and limit results
            $suggestions = array_unique($suggestions);
            $suggestions = array_slice($suggestions, 0, 10);

            return response()->json([
                'success' => true,
                'data' => $suggestions,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get suggestions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get search statistics.
     */
    public function getSearchStats(Request $request)
    {
        $user = $request->user();

        try {
            $stats = [
                'total_chats' => $user->chats()->count(),
                'total_messages' => $user->messages()->count(),
                'recent_chats_count' => $user->chats()
                    ->where('created_at', '>=', now()->subDays(7))
                    ->count(),
                'recent_messages_count' => $user->messages()
                    ->where('created_at', '>=', now()->subDays(7))
                    ->count(),
                'most_active_chat' => $user->chats()
                    ->withCount('messages')
                    ->orderBy('messages_count', 'desc')
                    ->first()?->title,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get search stats: ' . $e->getMessage(),
            ], 500);
        }
    }
}
