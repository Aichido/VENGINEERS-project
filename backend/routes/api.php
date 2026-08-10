<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\InterventionController;
use App\Http\Controllers\Api\CommercialOrderController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\NotificationController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:admin')->group(function () {
        Route::post('/admin/users', [UserController::class, 'store']);
    });
});
//client routes
Route::middleware(['auth:sanctum', 'role:client'])
    ->prefix('client')
    ->group(function () {
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::post('/orders', [OrderController::class, 'store']);

        Route::get('/interventions', [InterventionController::class, 'index']);
        Route::post('/interventions', [InterventionController::class, 'store']);
    });
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::post('/contact', [ContactController::class, 'store']);

//commercial routes
Route::middleware(['auth:sanctum', 'role:commercial'])
    ->prefix('commercial')
    ->group(function () {
        Route::get('/orders', [CommercialOrderController::class, 'index']);
        Route::get('/orders/{order}', [CommercialOrderController::class, 'show']); // ← nouveau
        Route::put('/orders/{order}', [CommercialOrderController::class, 'update']);

        Route::get('/stock', [StockController::class, 'index']);
        Route::post('/stock/{product}/notify-low-stock', [StockController::class, 'notifyLowStock']);
    });
    
//admin routes
Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('admin')
    ->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    });