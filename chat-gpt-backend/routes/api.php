<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Rate-limited authentication routes
Route::prefix('auth')->middleware('rate.limit:auth,10,1')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Protected routes (require authentication)
Route::middleware(['auth:sanctum', 'rate.limit:api,60,1'])->group(function () {
    
    // Chat routes
    Route::apiResource('chats', ChatController::class);
    Route::post('chats/{chat}/archive', [ChatController::class, 'archive']);
    Route::post('chats/{chat}/unarchive', [ChatController::class, 'unarchive']);
    Route::get('chats-archived', [ChatController::class, 'archived']);
    
    // Message routes (nested under chats)
    Route::apiResource('chats.messages', MessageController::class)->except(['create', 'edit']);
    Route::post('chats/{chat}/send', [MessageController::class, 'send']);
    
    // User management routes
    Route::prefix('user')->group(function () {
        Route::get('profile', [UserController::class, 'profile']);
        Route::put('profile', [UserController::class, 'updateProfile']);
        Route::put('password', [UserController::class, 'changePassword']);
        Route::get('preferences', [UserController::class, 'preferences']);
        Route::put('preferences', [UserController::class, 'updatePreferences']);
        Route::get('statistics', [UserController::class, 'statistics']);
        Route::delete('account', [UserController::class, 'deleteAccount']);
    });
});
