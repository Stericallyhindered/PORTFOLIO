// =============================================================================
// DEPRECATED - This file is no longer used
// =============================================================================
// All configuration has been moved to the backend server.
// API keys are now stored securely in Vercel environment variables.
// The Flutter app connects to the backend API - no direct API keys needed.
// =============================================================================

/// @deprecated Use ApiConfig instead - this file will be removed
class GitHubConfig {
  // REMOVED: All sensitive keys moved to backend server
  // The app now uses ApiConfig.baseUrl to connect to the central API
  
  @Deprecated('Use ApiService instead')
  static const String owner = '';
  
  @Deprecated('Use ApiService instead')
  static const String repo = '';
}
