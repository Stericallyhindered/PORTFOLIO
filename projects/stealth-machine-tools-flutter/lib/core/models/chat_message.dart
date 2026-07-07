class ChatMessage {
  final String id;
  final String content;
  final bool isUser;
  final DateTime timestamp;
  final String? machineId;
  final List<String>? referencedMaterials;
  final Map<String, dynamic>? metadata;

  const ChatMessage({
    required this.id,
    required this.content,
    required this.isUser,
    required this.timestamp,
    this.machineId,
    this.referencedMaterials,
    this.metadata,
  });

  factory ChatMessage.user({
    required String content,
    String? machineId,
    Map<String, dynamic>? metadata,
  }) {
    return ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: content,
      isUser: true,
      timestamp: DateTime.now(),
      machineId: machineId,
      metadata: metadata,
    );
  }

  factory ChatMessage.ai({
    required String content,
    String? machineId,
    List<String>? referencedMaterials,
    Map<String, dynamic>? metadata,
  }) {
    return ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: content,
      isUser: false,
      timestamp: DateTime.now(),
      machineId: machineId,
      referencedMaterials: referencedMaterials,
      metadata: metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'isUser': isUser,
      'timestamp': timestamp.toIso8601String(),
      'machineId': machineId,
      'referencedMaterials': referencedMaterials,
      'metadata': metadata,
    };
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      content: json['content'],
      isUser: json['isUser'],
      timestamp: DateTime.parse(json['timestamp']),
      machineId: json['machineId'],
      referencedMaterials: json['referencedMaterials']?.cast<String>(),
      metadata: json['metadata'],
    );
  }
}

