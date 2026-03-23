<?php
// app/Http/Controllers/Api/AuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Format user data for frontend (camelCase, includes role name).
     */
    private function formatUser(User $user): array
    {
        $user->loadMissing('role');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role?->name ?? 'user',
            'phone' => $user->phone,
            'isActive' => (bool) $user->is_active,
            'createdAt' => $user->created_at?->toISOString(),
            'updatedAt' => $user->updated_at?->toISOString(),
        ];
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        // Only allow registration for the 'client' role
        $clientRole = \App\Models\Role::where('name', 'client')->first();
        if (!$clientRole) {
            return response()->json(['error' => 'Client role not found. Please seed roles.'], 500);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $clientRole->id,
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user),
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user->is_active) {
            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json(['error' => 'Account is deactivated'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user),
                'token' => $token,
            ],
        ]);
    }

    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out',
        ]);
    }

    public function me()
    {
        $user = auth()->user();

        return response()->json([
            'success' => true,
            'data' => $this->formatUser($user),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['name', 'email', 'phone']));

        return response()->json([
            'success' => true,
            'data' => $this->formatUser($user->fresh()),
            'message' => 'Profile updated successfully',
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = auth()->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'error' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Le mot de passe actuel est incorrect'], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully',
        ]);
    }
}
