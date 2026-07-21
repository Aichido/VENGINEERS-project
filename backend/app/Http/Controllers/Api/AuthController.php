<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /// app/Http/Controllers/Api/AuthController.php

public function register(Request $request)
{
    $data = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|min:8|confirmed',
    ]);

    $clientRole = Role::where('name', 'client')->firstOrFail();

    $user = User::create([
        'name' => $data['name'],
        'email' => $data['email'],
        'password' => bcrypt($data['password']),
        'role_id' => $clientRole->id,
    ]);

    $token = $user->createToken('api')->plainTextToken;

    return response()->json(['user' => $user->load('role'), 'token' => $token]);
}

public function login(Request $request)
{
    $data = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $data['email'])->first();

    if (!$user || !Hash::check($data['password'], $user->password)) {
        return response()->json(['message' => 'Identifiants invalides'], 401);
    }

    $token = $user->createToken('api')->plainTextToken;

    return response()->json(['user' => $user->load('role'), 'token' => $token]);
}

public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Déconnecté']);
}

public function me(Request $request)
{
    return response()->json($request->user()->load('role'));
}
}
