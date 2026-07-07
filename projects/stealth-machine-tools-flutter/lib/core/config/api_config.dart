/// API Configuration for SMT App
/// 
/// This is the ONLY configuration file needed in the app.
/// All other data (materials, AI prompts, products, etc.) comes from the server.
class ApiConfig {
  /// Base URL for the API - Vercel deployment
  static const String baseUrl = 'https://customer-support-app-one.vercel.app';
  
  /// Development URL (use when running backend locally)
  static const String devBaseUrl = 'http://localhost:3000';
  
  /// Get the appropriate base URL based on environment
  static String get currentBaseUrl {
    // In production, use the main URL
    // For development, you can switch this to devBaseUrl
    const bool isDev = false; // Set to true for local development
    return isDev ? devBaseUrl : baseUrl;
  }
  
  /// API endpoint paths
  static const String authLogin = '/api/auth/login';
  static const String authRegister = '/api/auth/register';
  static const String authLogout = '/api/auth/logout';
  static const String authMe = '/api/auth/me';
  static const String authRefresh = '/api/auth/refresh';
  
  static const String users = '/api/users';
  static const String machines = '/api/machines';
  static const String machineTypes = '/api/machines/types';
  static const String materials = '/api/materials';
  static const String materialCategories = '/api/materials/categories';
  static const String tickets = '/api/tickets';
  static const String ticketCategories = '/api/tickets/categories';
  
  static const String aiChat = '/api/ai/chat';
  static const String aiConfig = '/api/ai/config';
  static const String aiPrompts = '/api/ai/prompts';
  static const String aiProducts = '/api/ai/products';
  static const String aiComponents = '/api/ai/components';
  
  static const String trainingModules = '/api/training/modules';
  static const String trainingProgress = '/api/training/progress';
  
  /// Request timeout in seconds
  static const int connectionTimeout = 30;
  static const int receiveTimeout = 60;
}
