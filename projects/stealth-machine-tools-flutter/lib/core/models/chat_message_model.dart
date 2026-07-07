enum MessageType {
  text,
  image,
  audio,
  video,
  document,
  system,
}

enum MessageSender {
  user,
  ai,
  admin,
  system,
}

class ChatMessageModel {
  String id;
  String userId;
  String? ticketId;
  String? machineId;
  String message;
  MessageType type;
  MessageSender sender;
  List<String>? attachments;
  Map<String, dynamic>? metadata;
  DateTime timestamp;
  bool isRead;

  ChatMessageModel({
    required this.id,
    required this.userId,
    this.ticketId,
    this.machineId,
    required this.message,
    required this.type,
    required this.sender,
    this.attachments,
    this.metadata,
    required this.timestamp,
    this.isRead = false,
  });

  // JSON serialization
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'ticketId': ticketId,
      'machineId': machineId,
      'message': message,
      'type': type.name,
      'sender': sender.name,
      'attachments': attachments,
      'metadata': metadata,
      'timestamp': timestamp.toIso8601String(),
      'isRead': isRead,
    };
  }

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'],
      userId: json['userId'],
      ticketId: json['ticketId'],
      machineId: json['machineId'],
      message: json['message'],
      type: MessageType.values.firstWhere(
        (type) => type.name == json['type'],
        orElse: () => MessageType.text,
      ),
      sender: MessageSender.values.firstWhere(
        (sender) => sender.name == json['sender'],
        orElse: () => MessageSender.user,
      ),
      attachments: json['attachments']?.cast<String>(),
      metadata: json['metadata'],
      timestamp: DateTime.parse(json['timestamp']),
      isRead: json['isRead'] ?? false,
    );
  }

  // Copy with method
  ChatMessageModel copyWith({
    String? id,
    String? userId,
    String? ticketId,
    String? machineId,
    String? message,
    MessageType? type,
    MessageSender? sender,
    List<String>? attachments,
    Map<String, dynamic>? metadata,
    DateTime? timestamp,
    bool? isRead,
  }) {
    return ChatMessageModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      ticketId: ticketId ?? this.ticketId,
      machineId: machineId ?? this.machineId,
      message: message ?? this.message,
      type: type ?? this.type,
      sender: sender ?? this.sender,
      attachments: attachments ?? this.attachments,
      metadata: metadata ?? this.metadata,
      timestamp: timestamp ?? this.timestamp,
      isRead: isRead ?? this.isRead,
    );
  }

  // Helper methods
  bool get isFromUser => sender == MessageSender.user;
  bool get isFromAI => sender == MessageSender.ai;
  bool get isFromAdmin => sender == MessageSender.admin;
  bool get isSystemMessage => sender == MessageSender.system;

  @override
  String toString() {
    return 'ChatMessageModel(id: $id, message: $message, sender: $sender, timestamp: $timestamp)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ChatMessageModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}