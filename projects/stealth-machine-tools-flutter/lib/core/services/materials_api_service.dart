import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/api_config.dart';
import '../models/support_material_model.dart';
import 'api_service.dart';

/// Materials service - fetches support materials from the API
/// 
/// This replaces the old remote_support_materials_service.dart
/// which had 40+ hardcoded materials.
class MaterialsApiService {
  final ApiService _api;

  MaterialsApiService({required ApiService api}) : _api = api;

  /// Get all materials with optional filters
  Future<List<SupportMaterial>> getMaterials({
    String? category,
    String? machineModel,
    String? fileType,
    String? search,
    int page = 1,
    int limit = 50,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (category != null) 'category': category,
      if (machineModel != null) 'machineModel': machineModel,
      if (fileType != null) 'fileType': fileType,
      if (search != null) 'search': search,
    };

    final response = await _api.get<List<dynamic>>(
      ApiConfig.materials,
      queryParameters: queryParams,
    );

    if (response.success && response.data != null) {
      return (response.data as List)
          .map((json) => SupportMaterial.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get a single material by ID
  Future<SupportMaterial?> getMaterial(String id) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${ApiConfig.materials}/$id',
    );

    if (response.success && response.data != null) {
      return SupportMaterial.fromJson(response.data!);
    }
    return null;
  }

  /// Get materials by category
  Future<List<SupportMaterial>> getMaterialsByCategory(String category) async {
    return getMaterials(category: category);
  }

  /// Search materials
  Future<List<SupportMaterial>> searchMaterials({
    required String query,
    String? machineModel,
    String? category,
  }) async {
    return getMaterials(
      search: query,
      machineModel: machineModel,
      category: category,
    );
  }

  /// Get material categories
  Future<List<MaterialCategory>> getCategories() async {
    final response = await _api.get<List<dynamic>>(
      ApiConfig.materialCategories,
    );

    if (response.success && response.data != null) {
      return (response.data as List)
          .map((json) => MaterialCategory.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }
}

/// Material category model
class MaterialCategory {
  final String id;
  final String name;
  final String displayName;
  final String? description;
  final String? icon;
  final String? color;

  MaterialCategory({
    required this.id,
    required this.name,
    required this.displayName,
    this.description,
    this.icon,
    this.color,
  });

  factory MaterialCategory.fromJson(Map<String, dynamic> json) {
    return MaterialCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      displayName: json['displayName'] as String,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
      color: json['color'] as String?,
    );
  }
}

// Provider
final materialsApiServiceProvider = Provider<MaterialsApiService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return MaterialsApiService(api: api);
});

// Materials list provider
final materialsProvider = FutureProvider.family<List<SupportMaterial>, MaterialsFilter?>((ref, filter) async {
  final service = ref.watch(materialsApiServiceProvider);
  return service.getMaterials(
    category: filter?.category,
    machineModel: filter?.machineModel,
    search: filter?.search,
  );
});

// Filter class
class MaterialsFilter {
  final String? category;
  final String? machineModel;
  final String? search;

  MaterialsFilter({this.category, this.machineModel, this.search});
}
