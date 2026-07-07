import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/chat_message.dart';

class AIService extends StateNotifier<List<ChatMessage>> {
  AIService() : super([]);

  static Future<void> initialize() async {
    // Initialize AI service
    print('AI Service initialized');
  }

  Future<ChatMessage> sendMessage({
    required String message,
    String? machineId,
    List<String>? attachments,
  }) async {
    // Create user message
    final userMessage = ChatMessage.user(
      content: message,
      machineId: machineId,
      metadata: {'attachments': attachments},
    );

    // Add user message to state
    state = [...state, userMessage];

    try {
      // Simulate AI response (replace with actual AI integration later)
      await Future.delayed(const Duration(milliseconds: 1000));
      
      final aiResponse = ChatMessage.ai(
        content: 'I received your message: "$message". This is a placeholder response. The AI integration will be added later.',
        machineId: machineId,
        metadata: {'isPlaceholder': true},
      );
      
      // Add AI response to state
      state = [...state, aiResponse];
      
      return aiResponse;
    } catch (e) {
      // Create error message
      final errorMessage = ChatMessage.ai(
        content: 'Sorry, I encountered an error. Please try again.',
        machineId: machineId,
        metadata: {'error': e.toString()},
      );
      
      state = [...state, errorMessage];
      return errorMessage;
    }
  }

  Future<List<ChatMessage>> getChatHistory({String? machineId}) async {
    if (machineId != null) {
      return state.where((message) => message.machineId == machineId).toList();
    }
    return state;
  }

  void clearChatHistory() {
    state = [];
  }

  List<ChatMessage> getMessagesForMachine(String machineId) {
    return state.where((message) => message.machineId == machineId).toList();
  }

  ChatMessage? getLastMessage() {
    return state.isNotEmpty ? state.last : null;
  }

  List<ChatMessage> getRecentMessages({int limit = 10}) {
    final sortedMessages = List<ChatMessage>.from(state);
    sortedMessages.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return sortedMessages.take(limit).toList();
  }
}

// Providers
final aiServiceProvider = StateNotifierProvider<AIService, List<ChatMessage>>((ref) {
  return AIService();
});

final chatHistoryProvider = Provider<List<ChatMessage>>((ref) {
  return ref.watch(aiServiceProvider);
});

final lastMessageProvider = Provider<ChatMessage?>((ref) {
  final messages = ref.watch(aiServiceProvider);
  return messages.isNotEmpty ? messages.last : null;
});