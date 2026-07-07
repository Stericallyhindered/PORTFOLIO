enum TicketPriority {
  low,
  medium,
  high,
  critical,
}

enum TicketStatus {
  open,
  inProgress,
  waitingForCustomer,
  resolved,
  closed,
}

enum TicketCategory {
  technical,
  installation,
  maintenance,
  training,
  parts,
  warranty,
  other,
}

class SupportTicketModel {
  String id;
  String userId;
  String? machineId;
  String title;
  String description;
  TicketPriority priority;
  TicketStatus status;
  TicketCategory category;
  String? assignedTo;
  List<String>? attachments;
  Map<String, dynamic>? metadata;
  DateTime createdAt;
  DateTime updatedAt;
  DateTime? resolvedAt;
  String? resolution;

  SupportTicketModel({
    required this.id,
    required this.userId,
    this.machineId,
    required this.title,
    required this.description,
    required this.priority,
    required this.status,
    required this.category,
    this.assignedTo,
    this.attachments,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
    this.resolvedAt,
    this.resolution,
  });

  // JSON serialization
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'machineId': machineId,
      'title': title,
      'description': description,
      'priority': priority.name,
      'status': status.name,
      'category': category.name,
      'assignedTo': assignedTo,
      'attachments': attachments,
      'metadata': metadata,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'resolvedAt': resolvedAt?.toIso8601String(),
      'resolution': resolution,
    };
  }

  factory SupportTicketModel.fromJson(Map<String, dynamic> json) {
    return SupportTicketModel(
      id: json['id'],
      userId: json['userId'],
      machineId: json['machineId'],
      title: json['title'],
      description: json['description'],
      priority: TicketPriority.values.firstWhere(
        (priority) => priority.name == json['priority'],
        orElse: () => TicketPriority.medium,
      ),
      status: TicketStatus.values.firstWhere(
        (status) => status.name == json['status'],
        orElse: () => TicketStatus.open,
      ),
      category: TicketCategory.values.firstWhere(
        (category) => category.name == json['category'],
        orElse: () => TicketCategory.other,
      ),
      assignedTo: json['assignedTo'],
      attachments: json['attachments']?.cast<String>(),
      metadata: json['metadata'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      resolvedAt: json['resolvedAt'] != null ? DateTime.parse(json['resolvedAt']) : null,
      resolution: json['resolution'],
    );
  }

  // Copy with method
  SupportTicketModel copyWith({
    String? id,
    String? userId,
    String? machineId,
    String? title,
    String? description,
    TicketPriority? priority,
    TicketStatus? status,
    TicketCategory? category,
    String? assignedTo,
    List<String>? attachments,
    Map<String, dynamic>? metadata,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? resolvedAt,
    String? resolution,
  }) {
    return SupportTicketModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      machineId: machineId ?? this.machineId,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      category: category ?? this.category,
      assignedTo: assignedTo ?? this.assignedTo,
      attachments: attachments ?? this.attachments,
      metadata: metadata ?? this.metadata,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      resolution: resolution ?? this.resolution,
    );
  }

  // Helper methods
  bool get isOpen => status == TicketStatus.open;
  bool get isInProgress => status == TicketStatus.inProgress;
  bool get isResolved => status == TicketStatus.resolved;
  bool get isClosed => status == TicketStatus.closed;
  bool get isHighPriority => priority == TicketPriority.high || priority == TicketPriority.critical;

  @override
  String toString() {
    return 'SupportTicketModel(id: $id, title: $title, status: $status, priority: $priority)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SupportTicketModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}