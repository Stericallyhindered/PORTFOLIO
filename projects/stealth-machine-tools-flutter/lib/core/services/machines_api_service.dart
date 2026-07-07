import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/api_config.dart';
import 'api_service.dart';

/// Machines API Service - fetches machine types and user machines from API
/// 
/// This replaces hardcoded machine model lists.
class MachinesApiService {
  final ApiService _api;

  MachinesApiService({required ApiService api}) : _api = api;

  /// Get machine types (for dropdowns)
  Future<List<MachineType>> getMachineTypes() async {
    final response = await _api.get<List<dynamic>>(ApiConfig.machineTypes);

    if (response.success && response.data != null) {
      return (response.data as List)
          .map((json) => MachineType.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get user's registered machines
  Future<List<Machine>> getUserMachines() async {
    final response = await _api.get<List<dynamic>>(ApiConfig.machines);

    if (response.success && response.data != null) {
      return (response.data as List)
          .map((json) => Machine.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get a single machine
  Future<Machine?> getMachine(String id) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${ApiConfig.machines}/$id',
    );

    if (response.success && response.data != null) {
      return Machine.fromJson(response.data!);
    }
    return null;
  }

  /// Register a new machine
  Future<Machine?> registerMachine({
    required String model,
    required String serialNumber,
    required String machineType,
    String? nickname,
    DateTime? purchaseDate,
    String? location,
    String? notes,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiConfig.machines,
      data: {
        'model': model,
        'serialNumber': serialNumber,
        'machineType': machineType,
        if (nickname != null) 'nickname': nickname,
        if (purchaseDate != null) 'purchaseDate': purchaseDate.toIso8601String(),
        if (location != null) 'location': location,
        if (notes != null) 'notes': notes,
      },
    );

    if (response.success && response.data != null) {
      return Machine.fromJson(response.data!);
    }
    return null;
  }
}

/// Machine type model (for dropdowns)
class MachineType {
  final String id;
  final String modelCode;
  final String displayName;
  final String category;
  final String? imageUrl;

  MachineType({
    required this.id,
    required this.modelCode,
    required this.displayName,
    required this.category,
    this.imageUrl,
  });

  factory MachineType.fromJson(Map<String, dynamic> json) {
    return MachineType(
      id: json['id'] as String,
      modelCode: json['modelCode'] as String,
      displayName: json['displayName'] as String,
      category: json['category'] as String,
      imageUrl: json['imageUrl'] as String?,
    );
  }
}

/// Machine model (user's registered machine)
class Machine {
  final String id;
  final String model;
  final String serialNumber;
  final String machineType;
  final String? nickname;
  final String status;
  final DateTime? purchaseDate;
  final String? location;
  final String? notes;

  Machine({
    required this.id,
    required this.model,
    required this.serialNumber,
    required this.machineType,
    this.nickname,
    required this.status,
    this.purchaseDate,
    this.location,
    this.notes,
  });

  factory Machine.fromJson(Map<String, dynamic> json) {
    return Machine(
      id: json['id'] as String,
      model: json['model'] as String,
      serialNumber: json['serialNumber'] as String,
      machineType: json['machineType'] as String,
      nickname: json['nickname'] as String?,
      status: json['status'] as String,
      purchaseDate: json['purchaseDate'] != null
          ? DateTime.parse(json['purchaseDate'] as String)
          : null,
      location: json['location'] as String?,
      notes: json['notes'] as String?,
    );
  }

  String get displayName => nickname ?? '$model ($serialNumber)';
}

// Providers
final machinesApiServiceProvider = Provider<MachinesApiService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return MachinesApiService(api: api);
});

final machineTypesProvider = FutureProvider<List<MachineType>>((ref) async {
  final service = ref.watch(machinesApiServiceProvider);
  return service.getMachineTypes();
});

final userMachinesProvider = FutureProvider<List<Machine>>((ref) async {
  final service = ref.watch(machinesApiServiceProvider);
  return service.getUserMachines();
});
