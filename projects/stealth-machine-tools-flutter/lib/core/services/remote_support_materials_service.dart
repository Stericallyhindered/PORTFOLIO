import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/support_material_model.dart';
import '../config/api_config.dart';
import 'api_service.dart';

/// Remote Support Materials Service
/// 
/// Fetches all support materials from the backend API.
/// No local assets are bundled - everything comes from Vercel Blob storage.
class RemoteSupportMaterialsService {
  final ApiService _api;
  
  RemoteSupportMaterialsService({required ApiService api}) : _api = api;
  
  /// Get all support materials from the API
  Future<List<SupportMaterial>> getAllMaterials() async {
    // #region agent log
    print('[DEBUG H4] getAllMaterials called');
    // #endregion
    try {
      final response = await _api.get<dynamic>(
        ApiConfig.materials,
        queryParameters: {'limit': '100'},
      );
      
      // #region agent log
      print('[DEBUG H4] getAllMaterials response: success=${response.success}, error=${response.error}, dataType=${response.data?.runtimeType}');
      // #endregion
      
      if (response.success && response.data != null) {
        // response.data is already the 'data' array from the API response
        final data = response.data as List<dynamic>?;
        // #region agent log
        print('[DEBUG H4] Materials data count: ${data?.length ?? 0}');
        // #endregion
        if (data != null) {
          return data.map((json) {
            // Convert _Map<dynamic, dynamic> to Map<String, dynamic>
            final Map<String, dynamic> typedJson = Map<String, dynamic>.from(json as Map);
            return SupportMaterial.fromJson(typedJson);
          }).toList();
        }
      }
      return [];
    } catch (e) {
      // #region agent log
      print('[DEBUG H4] getAllMaterials exception: $e');
      // #endregion
      return [];
    }
  }
  
  /// Get materials by category
  Future<List<SupportMaterial>> getMaterialsByCategory(String category) async {
    try {
      final response = await _api.get<dynamic>(
        ApiConfig.materials,
        queryParameters: {
          'category': category,
          'limit': '100',
        },
      );
      
      if (response.success && response.data != null) {
        final data = response.data as List<dynamic>?;
        if (data != null) {
          return data.map((json) {
            final Map<String, dynamic> typedJson = Map<String, dynamic>.from(json as Map);
            return SupportMaterial.fromJson(typedJson);
          }).toList();
        }
      }
      return [];
    } catch (e) {
      print('Error fetching materials by category: $e');
      return [];
    }
  }
  
  /// Search materials by query
  Future<List<SupportMaterial>> searchMaterials({
    required String query,
    String? machineModel,
    String? category,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': '100',
      };
      if (query.isNotEmpty) queryParams['search'] = query;
      if (category != null) queryParams['category'] = category;
      
      final response = await _api.get<dynamic>(
        ApiConfig.materials,
        queryParameters: queryParams,
      );
      
      if (response.success && response.data != null) {
        final data = response.data as List<dynamic>?;
        if (data != null) {
          var materials = data.map((json) {
            final Map<String, dynamic> typedJson = Map<String, dynamic>.from(json as Map);
            return SupportMaterial.fromJson(typedJson);
          }).toList();
          
          // Client-side filter for machine model if provided
          if (machineModel != null && machineModel.isNotEmpty) {
            materials = materials.where((m) => 
              m.machineModel?.toLowerCase().contains(machineModel.toLowerCase()) ?? false
            ).toList();
          }
          
          return materials;
        }
      }
      return [];
    } catch (e) {
      print('Error searching materials: $e');
      return [];
    }
  }
  
  /// Get a single material by ID
  Future<SupportMaterial?> getMaterialById(String id) async {
    try {
      final response = await _api.get<Map<String, dynamic>>(
        '${ApiConfig.materials}/$id',
      );
      
      if (response.success && response.data != null) {
        final data = response.data!['data'] as Map<String, dynamic>?;
        if (data != null) {
          return SupportMaterial.fromJson(data);
        }
      }
      return null;
    } catch (e) {
      print('Error fetching material by ID: $e');
      return null;
    }
  }
  
  /// Get all categories
  Future<List<MaterialCategory>> getCategories() async {
    try {
      final response = await _api.get<Map<String, dynamic>>(
        ApiConfig.materialCategories,
      );
      
      if (response.success && response.data != null) {
        final data = response.data!['data'] as List<dynamic>?;
        if (data != null) {
          return data.map((json) => MaterialCategory.fromJson(json as Map<String, dynamic>)).toList();
        }
      }
      return [];
    } catch (e) {
      print('Error fetching categories: $e');
      return [];
    }
  }
}

/// Material Category model
class MaterialCategory {
  final String id;
  final String name;
  final String displayName;
  final String? description;
  final String? icon;
  final String? color;
  final int sortOrder;
  final bool isActive;

  MaterialCategory({
    required this.id,
    required this.name,
    required this.displayName,
    this.description,
    this.icon,
    this.color,
    this.sortOrder = 0,
    this.isActive = true,
  });

  factory MaterialCategory.fromJson(Map<String, dynamic> json) {
    return MaterialCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      displayName: json['displayName'] as String,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
      color: json['color'] as String?,
      sortOrder: json['sortOrder'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}

// Provider
final remoteSupportMaterialsServiceProvider = Provider<RemoteSupportMaterialsService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return RemoteSupportMaterialsService(api: api);
});
