import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Secure storage service for sensitive data like JWT tokens
/// 
/// Note: For production, consider using flutter_secure_storage package
/// for encrypted storage. This uses SharedPreferences for simplicity.
class SecureStorageService {
  static const String _tokenKey = 'smt_auth_token';
  static const String _userIdKey = 'smt_user_id';
  static const String _userRoleKey = 'smt_user_role';

  SharedPreferences? _prefs;

  Future<SharedPreferences> get _preferences async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  /// Save the JWT token
  Future<void> saveToken(String token) async {
    final prefs = await _preferences;
    await prefs.setString(_tokenKey, token);
  }

  /// Get the stored JWT token
  Future<String?> getToken() async {
    final prefs = await _preferences;
    return prefs.getString(_tokenKey);
  }

  /// Delete the JWT token
  Future<void> deleteToken() async {
    final prefs = await _preferences;
    await prefs.remove(_tokenKey);
  }

  /// Save user info
  Future<void> saveUserInfo({
    required String userId,
    required String role,
  }) async {
    final prefs = await _preferences;
    await prefs.setString(_userIdKey, userId);
    await prefs.setString(_userRoleKey, role);
  }

  /// Get user ID
  Future<String?> getUserId() async {
    final prefs = await _preferences;
    return prefs.getString(_userIdKey);
  }

  /// Get user role
  Future<String?> getUserRole() async {
    final prefs = await _preferences;
    return prefs.getString(_userRoleKey);
  }

  /// Clear all auth data
  Future<void> clearAll() async {
    final prefs = await _preferences;
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_userRoleKey);
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}

// Provider
final secureStorageServiceProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});
