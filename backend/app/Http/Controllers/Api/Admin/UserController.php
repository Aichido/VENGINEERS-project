<?php

// app/Http/Controllers/Api/Admin/UserController.php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('role');

        if ($request->filled('role')) {
            $query->whereHas('role', fn ($q) => $q->where('name', $request->string('role')));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(15));
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        $role = Role::where('name', $validated['role'])->firstOrFail();

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'role_id'   => $role->id,
            'phone'     => $validated['phone'] ?? null,
            'address'   => $validated['address'] ?? null,
            'is_active' => true,
        ]);

        return response()->json($user->load('role'), 201);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->load('role'));
    }

    public function toggleActive(User $user)
    {
        $user->update(['is_active' => !$user->is_active]);

        return response()->json($user->load('role'));
    }

    public function destroy(User $user)
    {
        $user->delete(); // soft delete — historique préservé sur orders/interventions

        return response()->json(null, 204);
    }
}
