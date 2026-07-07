enum MachineStatus {
  active,
  inactive,
  maintenance,
  retired,
}

enum MachineType {
  pressBrake,
  fiberLaser,
  tubeLaser,
  cncMill,
  lathe,
  other,
}

class MachineModel {
  String id;
  String userId; // Owner of the machine
  String model;
  String serialNumber;
  MachineType machineType;
  MachineStatus status;
  DateTime purchaseDate;
  DateTime? lastServiceDate;
  DateTime? nextServiceDate;
  String? location;
  String? notes;
  Map<String, dynamic>? specifications;
  List<String>? attachments;
  DateTime createdAt;
  DateTime updatedAt;

  MachineModel({
    required this.id,
    required this.userId,
    required this.model,
    required this.serialNumber,
    required this.machineType,
    required this.status,
    required this.purchaseDate,
    this.lastServiceDate,
    this.nextServiceDate,
    this.location,
    this.notes,
    this.specifications,
    this.attachments,
    required this.createdAt,
    required this.updatedAt,
  });

  // JSON serialization
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'model': model,
      'serialNumber': serialNumber,
      'machineType': machineType.name,
      'status': status.name,
      'purchaseDate': purchaseDate.toIso8601String(),
      'lastServiceDate': lastServiceDate?.toIso8601String(),
      'nextServiceDate': nextServiceDate?.toIso8601String(),
      'location': location,
      'notes': notes,
      'specifications': specifications,
      'attachments': attachments,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory MachineModel.fromJson(Map<String, dynamic> json) {
    return MachineModel(
      id: json['id'],
      userId: json['userId'],
      model: json['model'],
      serialNumber: json['serialNumber'],
      machineType: MachineType.values.firstWhere(
        (type) => type.name == json['machineType'],
        orElse: () => MachineType.other,
      ),
      status: MachineStatus.values.firstWhere(
        (status) => status.name == json['status'],
        orElse: () => MachineStatus.active,
      ),
      purchaseDate: DateTime.parse(json['purchaseDate']),
      lastServiceDate: json['lastServiceDate'] != null ? DateTime.parse(json['lastServiceDate']) : null,
      nextServiceDate: json['nextServiceDate'] != null ? DateTime.parse(json['nextServiceDate']) : null,
      location: json['location'],
      notes: json['notes'],
      specifications: json['specifications'],
      attachments: json['attachments']?.cast<String>(),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  // Copy with method
  MachineModel copyWith({
    String? id,
    String? userId,
    String? model,
    String? serialNumber,
    MachineType? machineType,
    MachineStatus? status,
    DateTime? purchaseDate,
    DateTime? lastServiceDate,
    DateTime? nextServiceDate,
    String? location,
    String? notes,
    Map<String, dynamic>? specifications,
    List<String>? attachments,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return MachineModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      model: model ?? this.model,
      serialNumber: serialNumber ?? this.serialNumber,
      machineType: machineType ?? this.machineType,
      status: status ?? this.status,
      purchaseDate: purchaseDate ?? this.purchaseDate,
      lastServiceDate: lastServiceDate ?? this.lastServiceDate,
      nextServiceDate: nextServiceDate ?? this.nextServiceDate,
      location: location ?? this.location,
      notes: notes ?? this.notes,
      specifications: specifications ?? this.specifications,
      attachments: attachments ?? this.attachments,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Helper methods
  bool get isActive => status == MachineStatus.active;
  bool get needsMaintenance => nextServiceDate != null && DateTime.now().isAfter(nextServiceDate!);
  
  String get displayName => '$model (${serialNumber})';

  @override
  String toString() {
    return 'MachineModel(id: $id, model: $model, serialNumber: $serialNumber, type: $machineType)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is MachineModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}