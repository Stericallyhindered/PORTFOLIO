import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'ai_chat_service.dart' as ai_chat;
import 'remote_support_materials_service.dart';
import '../models/chat_message.dart';

class EnhancedAIService extends StateNotifier<List<ChatMessage>> {
  final ai_chat.AIChatService _chatService;
  final RemoteSupportMaterialsService _remoteSupportService;
  
  EnhancedAIService(this._chatService, this._remoteSupportService) : super([]);

  static Future<void> initialize() async {
    print('Enhanced AI Service initialized');
  }

  Future<ChatMessage> sendMessageWithContext({
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
      // Extract product references from the message
      final productReferences = _extractProductReferences(message);
      
      // Search for relevant materials
      List<Map<String, dynamic>> materials = [];
      if (productReferences.isNotEmpty) {
        for (final product in productReferences) {
          final productMaterials = await _remoteSupportService.searchMaterials(query: product);
          materials.addAll(productMaterials.map((m) => m.toJson()).toList());
        }
      }
      
      // If no specific products found, get some general materials based on keywords
      if (materials.isEmpty) {
        // Try to find materials based on common keywords in the message
        final keywords = _extractKeywords(message);
        for (final keyword in keywords) {
          final keywordMaterials = await _remoteSupportService.searchMaterials(query: keyword);
          materials.addAll(keywordMaterials.map((m) => m.toJson()).toList());
        }
        
        // If still no materials, get a few general ones
        if (materials.isEmpty) {
          final allMaterials = await _remoteSupportService.getAllMaterials();
          materials = allMaterials.take(10).map((m) => m.toJson()).toList();
        }
      }
      
      // Remove duplicates and limit to reasonable number
      final uniqueMaterials = <String, Map<String, dynamic>>{};
      for (final material in materials) {
        final id = material['id'] as String;
        if (!uniqueMaterials.containsKey(id)) {
          uniqueMaterials[id] = material;
        }
      }
      materials = uniqueMaterials.values.take(8).toList();
      
      // Send to AI with context
      final aiResponse = await _sendToAI(message, materials, machineId);
      
      // Add AI response to state
      state = [...state, aiResponse];
      
      return aiResponse;
    } catch (e) {
      // Create error message
      final errorMessage = ChatMessage.ai(
        content: 'Sorry, I encountered an error: ${e.toString()}. Please try again.',
        machineId: machineId,
        metadata: {'error': e.toString()},
      );
      
      state = [...state, errorMessage];
      return errorMessage;
    }
  }

  List<String> _extractProductReferences(String message) {
    // Extract product names, model numbers, part numbers
    final patterns = [
      // Stealth Machine Tools Products
      r'SS1510',  // Compact type fiber laser
      r'SS2060',  // Manual Loading Tube Fiber Laser
      r'SS2060A',  // Automatic Loading Tube Fiber Laser
      r'SS3015',  // Nighthawk Open type fiber laser
      r'SS3015CP',  // Nighthawk Fiber Laser w/ Enclosed Platform
      r'SL3015CP',  // Spirit MAX Fiber Laser w/ Enclosed Platform
      r'SS3015CPR',  // Nighthawk w/ Platform & Rotary Attachment
      r'X3',  // Fiber Laser w/ Enclosed Platform
      r'SLX1390',  // CO2 Laser
      r'Rapid\s*Sander',  // SMT Rapid Sander
      r'Press\s*Brake',  // CNC Press Brake
      r'Fiber\s*Marking\s*Laser',  // Fiber Marking Laser
      
      // Component References
      r'BLT\d+',  // BLT310, BLT421S
      r'CypCut\s*E?',  // CypCut E
      r'CypNest',
      r'AVENTICS?\s*\d+',  // AVENTICS 614
      r'Inovance\s*SV\d+',  // Inovance SV630N
      r'Raycus',
      r'Fiber\s*Laser',
      r'Transformer',
      r'Chiller',
      r'Pressure\s*Gauge',
      r'Gearbox',
      r'Laser\s*Head',
      r'Cutting\s*Head',
      r'Proportional\s*Valve',
      r'Servo\s*Drive',
      
      // General Terms
      r'Nighthawk',
      r'Spirit',
      r'Tube\s*Laser',
      r'CO2\s*Laser',
      r'Fiber\s*Marking',
      r'CNC\s*Press\s*Brake',
    ];

    final foundProducts = <String>{};
    
    for (final pattern in patterns) {
      final regex = RegExp(pattern, caseSensitive: false);
      final matches = regex.allMatches(message);
      for (final match in matches) {
        foundProducts.add(match.group(0)!);
      }
    }
    
    return foundProducts.toList();
  }

  List<String> _extractKeywords(String message) {
    final keywords = <String>{};
    final lowerMessage = message.toLowerCase();
    
    // Common technical terms
    final technicalTerms = [
      'laser', 'cutting', 'fiber', 'co2', 'installation', 'manual', 'troubleshoot',
      'maintenance', 'repair', 'replace', 'lens', 'head', 'software', 'cypcut',
      'cypnest', 'servo', 'drive', 'valve', 'pressure', 'gauge', 'chiller',
      'transformer', 'schematic', 'diagram', 'video', 'tutorial', 'guide',
      'error', 'alarm', 'quality', 'calibration', 'alignment', 'gas', 'assist'
    ];
    
    for (final term in technicalTerms) {
      if (lowerMessage.contains(term)) {
        keywords.add(term);
      }
    }
    
    return keywords.toList();
  }

  Future<ChatMessage> _sendToAI(String message, List<Map<String, dynamic>> materials, String? machineId) async {
    try {
      // Build messages list for the API
      final apiMessages = <ai_chat.ChatMessage>[
        ai_chat.ChatMessage(role: 'user', content: message),
      ];
      
      // Send message via the backend API (which handles AI prompts server-side)
      final response = await _chatService.sendMessage(
        messages: apiMessages,
        machineModel: machineId,
      );
      
      // Create referenced materials list with proper structure
      final referencedMaterials = materials.map((m) => {
        'title': m['title'] as String,
        'type': m['file_type'] as String? ?? m['type'] as String? ?? 'pdf',
        'category': m['category'] as String,
        'url': m['file_url'] as String? ?? m['url'] as String? ?? '',
        'is_local': m['is_local'] == true,
        'machine_model': m['machine_model'] as String?,
        'description': m['description'] as String? ?? '',
      }).toList();
      
      return ChatMessage.ai(
        content: response.content,
        machineId: machineId,
        referencedMaterials: response.referencedMaterials,
        metadata: {
          'referenced_materials': referencedMaterials,
          'materials_count': materials.length,
          'tokensUsed': response.tokensUsed,
          'sessionId': response.sessionId,
        },
      );
    } catch (e) {
      // Fallback response if AI fails
      return ChatMessage.ai(
        content: 'I understand you need help with: "$message". I\'m here to assist with Stealth Machine Tools products and support. Please let me know what specific machine or issue you\'re working with.',
        machineId: machineId,
        metadata: {'fallback': true, 'error': e.toString()},
      );
    }
  }

  // Get materials by category
  Future<List<Map<String, dynamic>>> getMaterialsByCategory(String category) async {
    final materials = await _remoteSupportService.getMaterialsByCategory(category);
    return materials.map((m) => m.toJson()).toList();
  }

  // Get materials for specific machine
  Future<List<Map<String, dynamic>>> getMaterialsByMachine(String machineModel) async {
    final materials = await _remoteSupportService.searchMaterials(query: machineModel);
    return materials.map((m) => m.toJson()).toList();
  }

  // Get all available materials
  Future<List<Map<String, dynamic>>> getAllMaterials() async {
    final materials = await _remoteSupportService.getAllMaterials();
    return materials.map((m) => m.toJson()).toList();
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
final enhancedAiServiceProvider = StateNotifierProvider<EnhancedAIService, List<ChatMessage>>((ref) {
  final chatService = ref.watch(ai_chat.aiChatServiceProvider);
  final remoteSupportService = ref.watch(remoteSupportMaterialsServiceProvider);
  return EnhancedAIService(chatService, remoteSupportService);
});

final chatHistoryProvider = Provider<List<ChatMessage>>((ref) {
  return ref.watch(enhancedAiServiceProvider);
});

final lastMessageProvider = Provider<ChatMessage?>((ref) {
  final messages = ref.watch(enhancedAiServiceProvider);
  return messages.isNotEmpty ? messages.last : null;
});