enum TrainingDifficulty {
  beginner,
  intermediate,
  advanced,
  expert,
}

enum TrainingStatus {
  notStarted,
  inProgress,
  completed,
  certified,
}

class TrainingModuleModel {
  String id;
  String title;
  String description;
  String content;
  String? machineModel;
  TrainingDifficulty difficulty;
  int estimatedDurationMinutes;
  List<String>? prerequisites;
  List<String>? learningObjectives;
  List<String>? attachments;
  bool isPublished;
  String? createdBy;
  DateTime createdAt;
  DateTime updatedAt;

  TrainingModuleModel({
    required this.id,
    required this.title,
    required this.description,
    required this.content,
    this.machineModel,
    required this.difficulty,
    required this.estimatedDurationMinutes,
    this.prerequisites,
    this.learningObjectives,
    this.attachments,
    this.isPublished = false,
    this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  // JSON serialization
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'content': content,
      'machineModel': machineModel,
      'difficulty': difficulty.name,
      'estimatedDurationMinutes': estimatedDurationMinutes,
      'prerequisites': prerequisites,
      'learningObjectives': learningObjectives,
      'attachments': attachments,
      'isPublished': isPublished,
      'createdBy': createdBy,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory TrainingModuleModel.fromJson(Map<String, dynamic> json) {
    return TrainingModuleModel(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      content: json['content'],
      machineModel: json['machineModel'],
      difficulty: TrainingDifficulty.values.firstWhere(
        (difficulty) => difficulty.name == json['difficulty'],
        orElse: () => TrainingDifficulty.beginner,
      ),
      estimatedDurationMinutes: json['estimatedDurationMinutes'],
      prerequisites: json['prerequisites']?.cast<String>(),
      learningObjectives: json['learningObjectives']?.cast<String>(),
      attachments: json['attachments']?.cast<String>(),
      isPublished: json['isPublished'] ?? false,
      createdBy: json['createdBy'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  // Copy with method
  TrainingModuleModel copyWith({
    String? id,
    String? title,
    String? description,
    String? content,
    String? machineModel,
    TrainingDifficulty? difficulty,
    int? estimatedDurationMinutes,
    List<String>? prerequisites,
    List<String>? learningObjectives,
    List<String>? attachments,
    bool? isPublished,
    String? createdBy,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TrainingModuleModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      content: content ?? this.content,
      machineModel: machineModel ?? this.machineModel,
      difficulty: difficulty ?? this.difficulty,
      estimatedDurationMinutes: estimatedDurationMinutes ?? this.estimatedDurationMinutes,
      prerequisites: prerequisites ?? this.prerequisites,
      learningObjectives: learningObjectives ?? this.learningObjectives,
      attachments: attachments ?? this.attachments,
      isPublished: isPublished ?? this.isPublished,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Helper methods
  String get durationText {
    final hours = estimatedDurationMinutes ~/ 60;
    final minutes = estimatedDurationMinutes % 60;
    if (hours > 0) {
      return minutes > 0 ? '${hours}h ${minutes}m' : '${hours}h';
    }
    return '${minutes}m';
  }

  @override
  String toString() {
    return 'TrainingModuleModel(id: $id, title: $title, difficulty: $difficulty)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TrainingModuleModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

class TrainingProgressModel {
  String userId;
  String moduleId;
  TrainingStatus status;
  double progressPercentage;
  DateTime? startedAt;
  DateTime? completedAt;
  DateTime? lastAccessedAt;
  Map<String, dynamic>? quizResults;
  List<String>? completedSections;

  TrainingProgressModel({
    required this.userId,
    required this.moduleId,
    required this.status,
    required this.progressPercentage,
    this.startedAt,
    this.completedAt,
    this.lastAccessedAt,
    this.quizResults,
    this.completedSections,
  });

  // JSON serialization
  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'moduleId': moduleId,
      'status': status.name,
      'progressPercentage': progressPercentage,
      'startedAt': startedAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'lastAccessedAt': lastAccessedAt?.toIso8601String(),
      'quizResults': quizResults,
      'completedSections': completedSections,
    };
  }

  factory TrainingProgressModel.fromJson(Map<String, dynamic> json) {
    return TrainingProgressModel(
      userId: json['userId'],
      moduleId: json['moduleId'],
      status: TrainingStatus.values.firstWhere(
        (status) => status.name == json['status'],
        orElse: () => TrainingStatus.notStarted,
      ),
      progressPercentage: json['progressPercentage']?.toDouble() ?? 0.0,
      startedAt: json['startedAt'] != null ? DateTime.parse(json['startedAt']) : null,
      completedAt: json['completedAt'] != null ? DateTime.parse(json['completedAt']) : null,
      lastAccessedAt: json['lastAccessedAt'] != null ? DateTime.parse(json['lastAccessedAt']) : null,
      quizResults: json['quizResults'],
      completedSections: json['completedSections']?.cast<String>(),
    );
  }

  // Copy with method
  TrainingProgressModel copyWith({
    String? userId,
    String? moduleId,
    TrainingStatus? status,
    double? progressPercentage,
    DateTime? startedAt,
    DateTime? completedAt,
    DateTime? lastAccessedAt,
    Map<String, dynamic>? quizResults,
    List<String>? completedSections,
  }) {
    return TrainingProgressModel(
      userId: userId ?? this.userId,
      moduleId: moduleId ?? this.moduleId,
      status: status ?? this.status,
      progressPercentage: progressPercentage ?? this.progressPercentage,
      startedAt: startedAt ?? this.startedAt,
      completedAt: completedAt ?? this.completedAt,
      lastAccessedAt: lastAccessedAt ?? this.lastAccessedAt,
      quizResults: quizResults ?? this.quizResults,
      completedSections: completedSections ?? this.completedSections,
    );
  }

  // Helper methods
  bool get isCompleted => status == TrainingStatus.completed || status == TrainingStatus.certified;
  bool get isInProgress => status == TrainingStatus.inProgress;

  @override
  String toString() {
    return 'TrainingProgressModel(userId: $userId, moduleId: $moduleId, status: $status, progress: $progressPercentage%)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TrainingProgressModel && 
           other.userId == userId && 
           other.moduleId == moduleId;
  }

  @override
  int get hashCode => Object.hash(userId, moduleId);
}