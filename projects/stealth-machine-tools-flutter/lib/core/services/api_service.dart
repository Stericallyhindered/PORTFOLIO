import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/api_config.dart';
import 'secure_storage_service.dart';

/// Central API service for all backend communication
/// 
/// This replaces all local/hardcoded data services.
/// All data now comes from the server.
class ApiService {
  final Dio _dio;
  final SecureStorageService _storage;
  String? _authToken;

  ApiService({required SecureStorageService storage})
      : _storage = storage,
        _dio = Dio(BaseOptions(
          baseUrl: ApiConfig.currentBaseUrl,
          connectTimeout: Duration(seconds: ApiConfig.connectionTimeout),
          receiveTimeout: Duration(seconds: ApiConfig.receiveTimeout),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        )) {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token to requests
        final token = _authToken ?? await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 errors (unauthorized)
        if (error.response?.statusCode == 401) {
          // Try to refresh token
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry the request
            final retryResponse = await _dio.fetch(error.requestOptions);
            return handler.resolve(retryResponse);
          }
        }
        return handler.next(error);
      },
    ));
  }

  /// Set the auth token (after login)
  void setAuthToken(String token) {
    _authToken = token;
  }

  /// Clear the auth token (on logout)
  void clearAuthToken() {
    _authToken = null;
  }

  /// Refresh the auth token
  Future<bool> _refreshToken() async {
    try {
      final response = await _dio.post(ApiConfig.authRefresh);
      if (response.data['success'] == true) {
        final newToken = response.data['data']['token'];
        await _storage.saveToken(newToken);
        _authToken = newToken;
        return true;
      }
    } catch (e) {
      // Token refresh failed
    }
    return false;
  }

  // =========================================================================
  // HTTP Methods
  // =========================================================================

  /// GET request
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromJson,
  }) async {
    // #region agent log
    print('[DEBUG H1] GET request to: ${ApiConfig.currentBaseUrl}$path');
    // #endregion
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      // #region agent log
      print('[DEBUG H2] GET response status: ${response.statusCode}, data keys: ${response.data?.keys?.toList()}');
      // #endregion
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      // #region agent log
      print('[DEBUG H2] GET error: ${e.type}, message: ${e.message}, response: ${e.response?.statusCode}');
      // #endregion
      return _handleError<T>(e);
    }
  }

  /// POST request
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    T Function(dynamic)? fromJson,
  }) async {
    // #region agent log
    print('[DEBUG H1] POST request to: ${ApiConfig.currentBaseUrl}$path');
    // #endregion
    try {
      final response = await _dio.post(path, data: data);
      // #region agent log
      print('[DEBUG H5] POST response status: ${response.statusCode}, success: ${response.data?['success']}');
      // #endregion
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      // #region agent log
      print('[DEBUG H5] POST error: ${e.type}, message: ${e.message}, statusCode: ${e.response?.statusCode}');
      // #endregion
      return _handleError<T>(e);
    }
  }

  /// PUT request
  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.put(path, data: data);
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return _handleError<T>(e);
    }
  }

  /// DELETE request
  Future<ApiResponse<T>> delete<T>(
    String path, {
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.delete(path);
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return _handleError<T>(e);
    }
  }

  /// Upload file
  Future<ApiResponse<T>> uploadFile<T>(
    String path,
    String filePath,
    String fieldName, {
    Map<String, dynamic>? additionalFields,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final formData = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(filePath),
        ...?additionalFields,
      });
      final response = await _dio.post(path, data: formData);
      return _handleResponse<T>(response, fromJson);
    } on DioException catch (e) {
      return _handleError<T>(e);
    }
  }

  // =========================================================================
  // Response Handling
  // =========================================================================

  ApiResponse<T> _handleResponse<T>(
    Response response,
    T Function(dynamic)? fromJson,
  ) {
    final data = response.data;
    
    if (data['success'] == true) {
      final resultData = data['data'];
      return ApiResponse<T>(
        success: true,
        data: fromJson != null ? fromJson(resultData) : resultData as T?,
        pagination: data['pagination'] != null
            ? Pagination.fromJson(data['pagination'])
            : null,
      );
    } else {
      return ApiResponse<T>(
        success: false,
        error: data['error'] ?? 'Unknown error',
      );
    }
  }

  ApiResponse<T> _handleError<T>(DioException e) {
    String message;
    
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        message = 'Connection timeout. Please check your internet connection.';
        break;
      case DioExceptionType.connectionError:
        message = 'Unable to connect to server. Please check your internet connection.';
        break;
      case DioExceptionType.badResponse:
        final data = e.response?.data;
        if (data is Map && data['error'] != null) {
          message = data['error'];
        } else {
          message = 'Server error: ${e.response?.statusCode}';
        }
        break;
      default:
        message = 'An error occurred. Please try again.';
    }
    
    return ApiResponse<T>(
      success: false,
      error: message,
      statusCode: e.response?.statusCode,
    );
  }
}

/// API Response wrapper
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final int? statusCode;
  final Pagination? pagination;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.statusCode,
    this.pagination,
  });
}

/// Pagination info
class Pagination {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final bool hasMore;

  Pagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasMore,
  });

  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 20,
      total: json['total'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
      hasMore: json['hasMore'] ?? false,
    );
  }
}

// =========================================================================
// Riverpod Provider
// =========================================================================

final apiServiceProvider = Provider<ApiService>((ref) {
  final storage = ref.watch(secureStorageServiceProvider);
  return ApiService(storage: storage);
});
