<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\InterventionController;
use App\Http\Controllers\Api\CommercialOrderController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\Admin\InterventionAssignmentController;
use App\Http\Controllers\Api\Technicien\InterventionController as TechnicienInterventionController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\InterventionController as AdminInterventionController;
use App\Http\Controllers\Api\Admin\StatsController as AdminStatsController;

use App\Http\Controllers\Api\InterventionReportDownloadController;



Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
     Route::get('/interventions/{intervention}/reports/{report}/download', [InterventionReportDownloadController::class, 'download']);

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
      Route::post('/interventions/{intervention}/assign', [InterventionAssignmentController::class, 'assign']);

       // CRUD utilisateurs (Phase 6.1)
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::put('/users/{user}', [AdminUserController::class, 'update']);
        Route::patch('/users/{user}/toggle-active', [AdminUserController::class, 'toggleActive']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

           // Catégories (6.2)
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

        // Produits (6.2)
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::put('/products/{product}', [AdminProductController::class, 'update']);
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);

        // Images produit (6.2)
        Route::post('/products/{product}/images', [AdminProductController::class, 'storeImage']);
        Route::delete('/products/{product}/images/{image}', [AdminProductController::class, 'destroyImage']);
        Route::patch('/products/{product}/images/{image}/set-primary', [AdminProductController::class, 'setPrimaryImage']);
        Route::patch('/products/{product}/images/reorder', [AdminProductController::class, 'reorderImages']);


        // Nouveau (6.3)
        Route::get('/interventions', [AdminInterventionController::class, 'index']);
        Route::post('/interventions', [AdminInterventionController::class, 'store']);
        Route::get('/interventions/{intervention}/reports', [AdminInterventionController::class, 'reports']);

        //6.4 stats
        Route::get('/stats', [AdminStatsController::class, 'index']);
    });
    
    // technicien routes
Route::middleware(['auth:sanctum', 'role:technicien'])
    ->prefix('technicien')
    ->group(function () {
        Route::get('/interventions', [TechnicienInterventionController::class, 'index']);
        Route::get('/interventions/{intervention}', [TechnicienInterventionController::class, 'show']);
        Route::put('/interventions/{intervention}', [TechnicienInterventionController::class, 'update']);
        Route::post('/interventions/{intervention}/report', [TechnicienInterventionController::class, 'storeReport']);
        Route::get('/reports', [TechnicienInterventionController::class, 'reports']);
    });
