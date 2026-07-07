import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/api_config.dart';
import 'api_service.dart';

/// AI Chat Service - handles chat with the AI assistant
/// 
/// This replaces the old anthropic_service.dart.
/// AI prompts and configuration are now managed server-side.
class AIChatService {
  final ApiService _api;

  AIChatService({required ApiService api}) : _api = api;

  /// Send a chat message and get AI response
  Future<ChatResponse> sendMessage({
    required List<ChatMessage> messages,
    String? sessionId,
    String? machineModel,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiConfig.aiChat,
      data: {
        'messages': messages.map((m) => m.toJson()).toList(),
        if (sessionId != null) 'sessionId': sessionId,
        if (machineModel != null) 'machineModel': machineModel,
      },
    );

    if (response.success && response.data != null) {
      return ChatResponse.fromJson(response.data!);
    }

    throw Exception(response.error ?? 'Failed to get AI response');
  }

  /// Get chat history for a session
  Future<List<ChatMessage>> getChatHistory(String sessionId) async {
    final response = await _api.get<List<dynamic>>(
      ApiConfig.aiChat,
      queryParameters: {'sessionId': sessionId},
    );

    if (response.success && response.data != null) {
      return (response.data as List)
          .map((json) => ChatMessage.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Get list of chat sessions
  Future<List<ChatSession>> getChatSessions() async {
    final response = await _api.get<List<dynamic>>(ApiConfig.aiChat);

    if (response.success && response.data != null) {
      return (response.data as List)
          .map((json) => ChatSession.fromJson(json as Map<String, dynamic>))
          .toList();
    }
    return [];
  }
}

/// Chat message model
class ChatMessage {
  final String? id;
  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime? createdAt;
  final Map<String, dynamic>? metadata;

  ChatMessage({
    this.id,
    required this.role,
    required this.content,
    this.createdAt,
    this.metadata,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String?,
      role: json['role'] as String,
      content: json['content'] as String,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      metadata: json['metadata'] != null
          ? Map<String, dynamic>.from(json['metadata'] as Map)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'role': role,
      'content': content,
    };
  }

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';
}

/// Chat response from API
class ChatResponse {
  final String content;
  final String sessionId;
  final int tokensUsed;
  final List<String> referencedMaterials;

  ChatResponse({
    required this.content,
    required this.sessionId,
    required this.tokensUsed,
    required this.referencedMaterials,
  });

  factory ChatResponse.fromJson(Map<String, dynamic> json) {
    return ChatResponse(
      content: json['content'] as String,
      sessionId: json['sessionId'] as String,
      tokensUsed: json['tokensUsed'] as int? ?? 0,
      referencedMaterials: (json['referencedMaterials'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}

/// Chat session model
class ChatSession {
  final String sessionId;
  final int messageCount;
  final DateTime lastMessageAt;

  ChatSession({
    required this.sessionId,
    required this.messageCount,
    required this.lastMessageAt,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      sessionId: json['sessionId'] as String,
      messageCount: json['_count']?['id'] as int? ?? 0,
      lastMessageAt: DateTime.parse(json['_max']?['createdAt'] as String),
    );
  }
}

// Provider
final aiChatServiceProvider = Provider<AIChatService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return AIChatService(api: api);
});

// Chat state provider
class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final String? error;
  final String? sessionId;

  const ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.error,
    this.sessionId,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    String? error,
    String? sessionId,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      sessionId: sessionId ?? this.sessionId,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final AIChatService _chatService;

  ChatNotifier(this._chatService) : super(const ChatState());

  Future<void> sendMessage(String content, {String? machineModel}) async {
    // Add user message
    final userMessage = ChatMessage(role: 'user', content: content);
    state = state.copyWith(
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    );

    try {
      // Send to API
      final response = await _chatService.sendMessage(
        messages: state.messages,
        sessionId: state.sessionId,
        machineModel: machineModel,
      );

      // Add assistant response
      final assistantMessage = ChatMessage(
        role: 'assistant',
        content: response.content,
        metadata: {
          'tokensUsed': response.tokensUsed,
          'referencedMaterials': response.referencedMaterials,
        },
      );

      state = state.copyWith(
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        sessionId: response.sessionId,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  void clearChat() {
    state = const ChatState();
  }
}

final chatNotifierProvider =
    StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  final chatService = ref.watch(aiChatServiceProvider);
  return ChatNotifier(chatService);
});
