import 'package:flutter/foundation.dart';

class DevConfig {
  // Portfolio-safe placeholders. Real development credentials are supplied
  // through environment/configuration outside this public snapshot.
  static const String defaultAdminEmail = 'admin@example.com';
  static const String defaultAdminPassword = '';
  static const String defaultAdminFirstName = 'System';
  static const String defaultAdminLastName = 'Administrator';
  
  // Development API Configuration
  static const String devBaseUrl = 'http://localhost:3000/api'; // Local development
  static const String stagingBaseUrl = 'https://staging.stealthmachinetools.com/api';
  static const String productionBaseUrl = 'https://stealthmachinetools.com/api';
  
  // Get the appropriate base URL based on environment
  static String get baseUrl {
    if (kDebugMode) {
      // In debug mode, use local development server
      return devBaseUrl;
    } else {
      // In release mode, use production server
      return productionBaseUrl;
    }
  }
  
  // Feature flags for development
  static const bool enableMockData = true;
  static const bool enableDebugLogging = true;
  static const bool enableOfflineMode = false;
  
  // Default machine models for testing
  static const List<String> defaultMachineModels = [
    'SS1510',
    'S1660',
    'S1660 Max',
    'SMT-2000',
    'SMT-3000',
    'Fiber Laser',
    'Press Brake',
    'Tube Laser',
  ];
  
  // Default admin permissions
  static const List<String> defaultAdminPermissions = [
    'user_management',
    'content_management',
    'system_settings',
    'analytics_view',
    'training_management',
    'support_tickets',
    'machine_registration',
    'backup_restore',
  ];
}
