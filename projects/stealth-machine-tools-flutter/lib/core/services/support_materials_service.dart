import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/support_material_model.dart';

class SupportMaterialsService {
  final Dio _dio;
  final String _baseUrl;
  
  SupportMaterialsService({required String baseUrl}) 
    : _baseUrl = baseUrl,
      _dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 60),
      ));
  
  // Get all local support materials
  Future<List<SupportMaterial>> getLocalMaterials() async {
    final materials = <SupportMaterial>[];
    
    // Load materials from assets
    final manifestContent = await rootBundle.loadString('AssetManifest.json');
    final Map<String, dynamic> manifestMap = json.decode(manifestContent);
    
    // Filter for support materials
    final supportMaterialKeys = manifestMap.keys
        .where((String key) => key.startsWith('assets/support_materials/'))
        .toList();
    
    for (final key in supportMaterialKeys) {
      final material = _createMaterialFromAssetPath(key);
      if (material != null) {
        materials.add(material);
      }
    }
    
    return materials;
  }
  
  // Get remote materials (videos, large files)
  Future<List<SupportMaterial>> getRemoteMaterials() async {
    try {
      final response = await _dio.get('$_baseUrl/api/support-materials/remote');
      return (response.data['materials'] as List)
          .map((json) => SupportMaterial.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching remote materials: $e');
      return [];
    }
  }
  
  // Search materials by query
  Future<List<SupportMaterial>> searchMaterials({
    required String query,
    String? machineModel,
    String? category,
    bool includeRemote = true,
  }) async {
    final results = <SupportMaterial>[];
    
    // Search local materials
    final localMaterials = await getLocalMaterials();
    final filteredLocal = localMaterials.where((material) {
      final matchesQuery = material.title.toLowerCase().contains(query.toLowerCase()) ||
                          material.description.toLowerCase().contains(query.toLowerCase()) ||
                          material.tags.any((tag) => tag.toLowerCase().contains(query.toLowerCase()));
      
      final matchesMachine = machineModel == null || 
                            material.machineModel == null || 
                            material.machineModel!.toLowerCase().contains(machineModel.toLowerCase());
      
      final matchesCategory = category == null || 
                             material.category.toLowerCase() == category.toLowerCase();
      
      return matchesQuery && matchesMachine && matchesCategory;
    }).toList();
    
    results.addAll(filteredLocal);
    
    // Search remote materials if requested
    if (includeRemote) {
      try {
        final response = await _dio.get('$_baseUrl/api/support-materials/search', 
          queryParameters: {
            'q': query,
            if (machineModel != null) 'machine_model': machineModel,
            if (category != null) 'category': category,
          }
        );
        
        final remoteMaterials = (response.data['results'] as List)
            .map((json) => SupportMaterial.fromJson(json))
            .toList();
        
        results.addAll(remoteMaterials);
      } catch (e) {
        print('Error searching remote materials: $e');
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => _calculateRelevanceScore(a, query).compareTo(_calculateRelevanceScore(b, query)));
    
    return results;
  }
  
  // Get material content for AI processing
  Future<String> getMaterialContent(String materialId, {bool isRemote = false}) async {
    if (isRemote) {
      try {
        final response = await _dio.get('$_baseUrl/api/support-materials/$materialId/content');
        return response.data['content'];
      } catch (e) {
        throw Exception('Failed to fetch remote material content: $e');
      }
    } else {
      // For local materials, read from assets
      try {
        final content = await rootBundle.loadString('assets/support_materials/$materialId');
        return content;
      } catch (e) {
        throw Exception('Failed to read local material content: $e');
      }
    }
  }
  
  // Get material file path for local materials
  Future<String> getLocalMaterialPath(String materialId) async {
    return 'assets/support_materials/$materialId';
  }
  
  // Get remote material URL
  String getRemoteMaterialUrl(String materialId) {
    return '$_baseUrl/api/support-materials/$materialId/download';
  }
  
  // Download and cache remote material
  Future<String> downloadAndCacheMaterial(String materialId) async {
    try {
      final url = getRemoteMaterialUrl(materialId);
      final response = await _dio.get(url, options: Options(responseType: ResponseType.bytes));
      
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/support_materials/$materialId');
      await file.create(recursive: true);
      await file.writeAsBytes(response.data);
      
      return file.path;
    } catch (e) {
      throw Exception('Failed to download material: $e');
    }
  }
  
  // Create material from asset path
  SupportMaterial? _createMaterialFromAssetPath(String assetPath) {
    final pathParts = assetPath.split('/');
    if (pathParts.length < 3) return null;
    
    final category = pathParts[2]; // manuals, contracts, troubleshooting, schematics
    final fileName = pathParts.last;
    final fileExtension = fileName.split('.').last.toLowerCase();
    
    // Determine file type
    String fileType;
    switch (fileExtension) {
      case 'pdf':
        fileType = 'pdf';
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
        fileType = 'image';
        break;
      case 'docx':
        fileType = 'document';
        break;
      case 'txt':
        fileType = 'text';
        break;
      default:
        fileType = 'unknown';
    }
    
    // Extract title from filename
    final title = fileName.replaceAll('_', ' ').replaceAll('.${fileExtension}', '');
    
    // Determine machine model from filename
    String? machineModel;
    if (title.toLowerCase().contains('blt310')) {
      machineModel = 'BLT310';
    } else if (title.toLowerCase().contains('blt421')) {
      machineModel = 'BLT421S';
    } else if (title.toLowerCase().contains('cypcut')) {
      machineModel = 'CypCut E';
    } else if (title.toLowerCase().contains('cypnest')) {
      machineModel = 'CypNest';
    } else if (title.toLowerCase().contains('inovance')) {
      machineModel = 'Inovance SV630N';
    } else if (title.toLowerCase().contains('aventics')) {
      machineModel = 'AVENTICS 614';
    }
    
    // Generate tags
    final tags = <String>[];
    tags.add(category);
    tags.add(fileType);
    if (machineModel != null) {
      tags.add(machineModel.toLowerCase().replaceAll(' ', '_'));
    }
    
    return SupportMaterial(
      id: assetPath,
      title: title,
      description: _generateDescription(title, category, fileType),
      category: category,
      fileType: fileType,
      fileUrl: assetPath,
      machineModel: machineModel,
      tags: tags,
      lastUpdated: DateTime.now(),
      fileSizeBytes: 0, // Will be updated when file is loaded
      metadata: {
        'is_local': true,
        'asset_path': assetPath,
      },
    );
  }
  
  String _generateDescription(String title, String category, String fileType) {
    switch (category) {
      case 'manuals':
        return 'User manual and technical documentation for $title';
      case 'contracts':
        return 'Contract template and legal documentation for $title';
      case 'troubleshooting':
        return 'Troubleshooting guide and FAQ for $title';
      case 'schematics':
        return 'Technical schematic diagram for $title';
      default:
        return 'Support material for $title';
    }
  }
  
  int _calculateRelevanceScore(SupportMaterial material, String query) {
    final queryLower = query.toLowerCase();
    int score = 0;
    
    // Title match (highest priority)
    if (material.title.toLowerCase().contains(queryLower)) {
      score += 100;
    }
    
    // Description match
    if (material.description.toLowerCase().contains(queryLower)) {
      score += 50;
    }
    
    // Tag match
    for (final tag in material.tags) {
      if (tag.toLowerCase().contains(queryLower)) {
        score += 25;
      }
    }
    
    // Machine model match
    if (material.machineModel?.toLowerCase().contains(queryLower) == true) {
      score += 75;
    }
    
    return score;
  }
}

// Provider for Support Materials Service
final supportMaterialsServiceProvider = Provider<SupportMaterialsService>((ref) {
  return SupportMaterialsService(baseUrl: 'https://support.stealthmachinetools.com');
});
