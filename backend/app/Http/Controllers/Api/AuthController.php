<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\LogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(private LogService $logService)
    {
    }

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

        $this->logService->loginAudit($user, 'register', true, $request);

        return response()->json(['user' => $user->load('role'), 'token' => $token]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            $this->logService->loginAudit($user, 'login', false, $request, 'invalid_credentials');

            return response()->json(['message' => 'Identifiants invalides'], 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        $this->logService->loginAudit($user, 'login', true, $request);

        return response()->json(['user' => $user->load('role'), 'token' => $token]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        $request->user()->currentAccessToken()->delete();

        $this->logService->loginAudit($user, 'logout', true, $request);

        return response()->json(['message' => 'Déconnecté']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('role'));
    }
}
