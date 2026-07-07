class SupportMaterial {
  final String id;
  final String title;
  final String description;
  final String category;
  final String fileType;
  final String fileUrl;
  final String? machineModel;
  final List<String> tags;
  final DateTime lastUpdated;
  final int fileSizeBytes;
  final Map<String, dynamic> metadata;
  
  SupportMaterial({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.fileType,
    required this.fileUrl,
    this.machineModel,
    required this.tags,
    required this.lastUpdated,
    required this.fileSizeBytes,
    required this.metadata,
  });
  
  factory SupportMaterial.fromJson(Map<String, dynamic> json) {
    // Handle both snake_case (old) and camelCase (API) formats
    return SupportMaterial(
      id: json['id'] as String,
      title: json['title'] as String,
      description: (json['description'] ?? '') as String,
      category: json['category'] as String,
      fileType: (json['fileType'] ?? json['file_type'] ?? 'pdf') as String,
      fileUrl: (json['fileUrl'] ?? json['file_url'] ?? '') as String,
      machineModel: (json['machineModel'] ?? json['machine_model']) as String?,
      tags: List<String>.from(json['tags'] ?? []),
      lastUpdated: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt'] as String)
          : (json['last_updated'] != null 
              ? DateTime.parse(json['last_updated'] as String)
              : DateTime.now()),
      fileSizeBytes: (json['fileSize'] ?? json['file_size_bytes'] ?? 0) as int,
      metadata: json['metadata'] != null 
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : {},
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'file_type': fileType,
      'file_url': fileUrl,
      'machine_model': machineModel,
      'tags': tags,
      'last_updated': lastUpdated.toIso8601String(),
      'file_size_bytes': fileSizeBytes,
      'metadata': metadata,
    };
  }
  
  // Convenience getters
  bool get isVideo => fileType == 'mp4' || fileType == 'video';
  bool get isPdf => fileType == 'pdf';
  bool get isImage => fileType == 'png' || fileType == 'jpg' || fileType == 'jpeg' || fileType == 'image';
  bool get isDocument => fileType == 'docx' || fileType == 'document';
  bool get isText => fileType == 'txt' || fileType == 'text';
  bool get isExecutable => fileType == 'exe';
  bool get isLocal => metadata['is_local'] == true;
  bool get isRemote => !isLocal;
  
  // Get display icon
  String get displayIcon {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'mp4':
      case 'video':
        return '🎥';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image':
        return '🖼️';
      case 'docx':
      case 'document':
        return '📝';
      case 'txt':
      case 'text':
        return '📄';
      case 'exe':
        return '💻';
      default:
        return '📎';
    }
  }
  
  // Get category display name
  String get categoryDisplayName {
    switch (category) {
      case 'manuals':
        return 'User Manuals';
      case 'contracts':
        return 'Contracts & Legal';
      case 'troubleshooting':
        return 'Troubleshooting';
      case 'schematics':
        return 'Schematics';
      case 'videos':
        return 'Video Tutorials';
      default:
        return category.toUpperCase();
    }
  }
  
  // Get file size display
  String get fileSizeDisplay {
    if (fileSizeBytes == 0) return 'Unknown size';
    
    if (fileSizeBytes < 1024) {
      return '${fileSizeBytes} B';
    } else if (fileSizeBytes < 1024 * 1024) {
      return '${(fileSizeBytes / 1024).toStringAsFixed(1)} KB';
    } else if (fileSizeBytes < 1024 * 1024 * 1024) {
      return '${(fileSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(fileSizeBytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }
  
  // Check if material matches search query
  bool matchesQuery(String query) {
    final queryLower = query.toLowerCase();
    return title.toLowerCase().contains(queryLower) ||
           description.toLowerCase().contains(queryLower) ||
           tags.any((tag) => tag.toLowerCase().contains(queryLower)) ||
           (machineModel?.toLowerCase().contains(queryLower) ?? false);
  }
  
  // Get relevance score for search
  int getRelevanceScore(String query) {
    final queryLower = query.toLowerCase();
    int score = 0;
    
    // Title match (highest priority)
    if (title.toLowerCase().contains(queryLower)) {
      score += 100;
    }
    
    // Description match
    if (description.toLowerCase().contains(queryLower)) {
      score += 50;
    }
    
    // Tag match
    for (final tag in tags) {
      if (tag.toLowerCase().contains(queryLower)) {
        score += 25;
      }
    }
    
    // Machine model match
    if (machineModel?.toLowerCase().contains(queryLower) == true) {
      score += 75;
    }
    
    return score;
  }
  
  @override
  String toString() {
    return 'SupportMaterial(id: $id, title: $title, category: $category, fileType: $fileType)';
  }
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SupportMaterial && other.id == id;
  }
  
  @override
  int get hashCode => id.hashCode;
}

