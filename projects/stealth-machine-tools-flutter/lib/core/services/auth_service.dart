import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import 'api_service.dart';
import 'secure_storage_service.dart';

/// Authentication state
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final UserModel? user;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = true,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    UserModel? user,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error,
    );
  }

  static const initial = AuthState();
}

/// Authentication service - handles login, logout, and session management
class AuthService extends StateNotifier<AuthState> {
  final ApiService _api;
  final SecureStorageService _storage;

  AuthService({
    required ApiService api,
    required SecureStorageService storage,
  })  : _api = api,
        _storage = storage,
        super(AuthState.initial) {
    // Check auth status on initialization
    checkAuthStatus();
  }

  /// Check if user is already logged in
  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true);

    final token = await _storage.getToken();
    if (token == null) {
      state = state.copyWith(isAuthenticated: false, isLoading: false);
      return;
    }

    // Validate token with server
    _api.setAuthToken(token);
    final response = await _api.get<Map<String, dynamic>>(ApiConfig.authMe);

    if (response.success && response.data != null) {
      final user = UserModel.fromJson(response.data!);
      state = AuthState(
        isAuthenticated: true,
        isLoading: false,
        user: user,
      );
    } else {
      // Token invalid, clear it
      await _storage.deleteToken();
      _api.clearAuthToken();
      state = state.copyWith(isAuthenticated: false, isLoading: false);
    }
  }

  /// Login with email and password
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    final response = await _api.post<Map<String, dynamic>>(
      ApiConfig.authLogin,
      data: {
        'email': email,
        'password': password,
      },
    );

    if (response.success && response.data != null) {
      final token = response.data!['token'] as String;
      final userData = response.data!['user'] as Map<String, dynamic>;
      final user = UserModel.fromJson(userData);

      // Save token
      await _storage.saveToken(token);
      await _storage.saveUserInfo(userId: user.id, role: user.role);
      _api.setAuthToken(token);

      state = AuthState(
        isAuthenticated: true,
        isLoading: false,
        user: user,
      );
      return true;
    } else {
      state = state.copyWith(
        isLoading: false,
        error: response.error ?? 'Login failed',
      );
      return false;
    }
  }

  /// Register a new user
  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? company,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    final response = await _api.post<Map<String, dynamic>>(
      ApiConfig.authRegister,
      data: {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        if (company != null) 'company': company,
        if (phone != null) 'phone': phone,
      },
    );

    if (response.success && response.data != null) {
      final token = response.data!['token'] as String;
      final userData = response.data!['user'] as Map<String, dynamic>;
      final user = UserModel.fromJson(userData);

      // Save token
      await _storage.saveToken(token);
      await _storage.saveUserInfo(userId: user.id, role: user.role);
      _api.setAuthToken(token);

      state = AuthState(
        isAuthenticated: true,
        isLoading: false,
        user: user,
      );
      return true;
    } else {
      state = state.copyWith(
        isLoading: false,
        error: response.error ?? 'Registration failed',
      );
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);

    // Call logout endpoint
    await _api.post(ApiConfig.authLogout);

    // Clear local storage
    await _storage.clearAll();
    _api.clearAuthToken();

    state = const AuthState(
      isAuthenticated: false,
      isLoading: false,
    );
  }

  /// Update user profile
  Future<bool> updateProfile({
    String? firstName,
    String? lastName,
    String? company,
    String? phone,
  }) async {
    final response = await _api.put<Map<String, dynamic>>(
      ApiConfig.authMe,
      data: {
        if (firstName != null) 'firstName': firstName,
        if (lastName != null) 'lastName': lastName,
        if (company != null) 'company': company,
        if (phone != null) 'phone': phone,
      },
    );

    if (response.success && response.data != null) {
      final user = UserModel.fromJson(response.data!);
      state = state.copyWith(user: user);
      return true;
    }
    return false;
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Providers
final authServiceProvider = StateNotifierProvider<AuthService, AuthState>((ref) {
  final api = ref.watch(apiServiceProvider);
  final storage = ref.watch(secureStorageServiceProvider);
  return AuthService(api: api, storage: storage);
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authServiceProvider).isAuthenticated;
});

final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authServiceProvider).user;
});
