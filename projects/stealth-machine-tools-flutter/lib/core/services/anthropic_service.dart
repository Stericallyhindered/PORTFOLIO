// =============================================================================
// DEPRECATED - Use AIChatService instead
// =============================================================================
// This service has been replaced by AIChatService which routes all AI requests
// through the backend API. Direct Anthropic API calls are no longer supported
// as the API key is now stored securely on the server.
// =============================================================================

import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'ai_chat_service.dart';

@Deprecated('Use AIChatService instead - AI requests now go through the backend API')
class AnthropicService {
  final Dio _dio;
  
  AnthropicService({required String apiKey}) 
    : _dio = Dio(BaseOptions(
        baseUrl: 'https://api.anthropic.com/v1',
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 60),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      ));
  
  // Factory constructor - now throws error since API key is server-side
  factory AnthropicService.withDefaults() {
    throw UnsupportedError(
      'Direct Anthropic API calls are no longer supported. '
      'Use AIChatService instead which routes through the backend API.'
    );
  }
  
  Future<String> sendMessage({
    required String message,
    String? systemPrompt,
    List<Map<String, dynamic>>? context,
    int maxTokens = 4000,
  }) async {
    try {
      final messages = <Map<String, dynamic>>[];
      
      // Add context if provided
      if (context != null) {
        messages.addAll(context);
      }
      
      // Add user message
      messages.add({
        'role': 'user',
        'content': message,
      });
      
      final requestBody = {
        'model': 'claude-3-5-sonnet-20241022',
        'max_tokens': maxTokens,
        'messages': messages,
        if (systemPrompt != null) 'system': systemPrompt,
      };
      
      final response = await _dio.post('/messages', data: requestBody);
      
      if (response.statusCode == 200) {
        final content = response.data['content'] as List;
        if (content.isNotEmpty) {
          return content.first['text'] as String;
        } else {
          throw Exception('No content in response');
        }
      } else {
        throw Exception('API request failed: ${response.statusMessage}');
      }
    } catch (e) {
      throw Exception('Anthropic API error: $e');
    }
  }
  
  Future<String> sendMessageWithMaterials({
    required String userMessage,
    required List<Map<String, dynamic>> materials,
    String? machineModel,
  }) async {
    final systemPrompt = _buildSystemPrompt(materials, machineModel);
    final context = _buildContextFromMaterials(materials);
    
    return await sendMessage(
      message: userMessage,
      systemPrompt: systemPrompt,
      context: context,
    );
  }
  
  String _buildSystemPrompt(List<Map<String, dynamic>> materials, String? machineModel) {
    return '''
You are a comprehensive Stealth Machine Tools technical support AI assistant. You are an expert in laser cutting machines, fiber lasers, and all related equipment. You have access to extensive technical documentation, manuals, videos, and troubleshooting guides.

Your expertise includes:
- Stealth Machine Tools Products:
  * SS1510 - Compact type fiber laser
  * SS2060 - Manual Loading Tube Fiber Laser Cutting Machine
  * SS2060A - Automatic Loading Tube Fiber Laser Cutting Machine
  * SS3015 "Nighthawk" - Open type fiber laser
  * SS3015CP "Nighthawk" - Fiber Laser w/ Enclosed Platform
  * SL3015CP "Spirit" - MAX Fiber Laser w/ Enclosed Platform
  * SS3015CPR "Nighthawk" - w/ Platform & Rotary Attachment
  * X3 - Fiber Laser w/ Enclosed Platform
  * SLX1390 - CO2 Laser
  * Press Brake - CNC Press Brake
  * Fiber Marking Laser
  * SMT Rapid Sander
- Component Systems:
  * BLT laser heads (BLT310, BLT421S)
  * CypCut E software and CypNest
  * AVENTICS proportional valves
  * Inovance servo drives
  * Fiber laser systems
- Machine troubleshooting and maintenance
- Installation and setup procedures
- Safety protocols and best practices

Available Support Materials:
${materials.map((m) => '- ${m['title']} (${m['file_type']?.toUpperCase() ?? 'PDF'}) - ${m['category']} - Machine: ${m['machine_model'] ?? 'General'}').join('\n')}

CRITICAL INSTRUCTIONS:
1. You are a COMPREHENSIVE technical support specialist - provide detailed, actionable answers
2. ALWAYS reference specific materials when relevant: "According to [Material Name]..."
3. For video tutorials: "Watch the video: [Material Name] - this shows step-by-step instructions"
4. For schematics: "Check the diagram: [Material Name] - this shows the technical layout"
5. For manuals: "See the manual: [Material Name] - this contains detailed procedures"
6. Always prioritize safety and proper procedures
7. Use step-by-step guidance when appropriate
8. Be conversational but professional and knowledgeable
9. Ask follow-up questions to better understand the issue
10. Provide multiple solutions when possible
11. Include specific part numbers, model numbers, and technical specifications
12. Reference the exact materials available to help the user

Response format:
- Start with a direct, comprehensive answer
- Reference materials with their types and what they contain
- Provide detailed actionable steps
- Include safety reminders when relevant
- Ask clarifying questions if needed
- End with additional resources and next steps

Remember: You have access to extensive technical documentation. Use it to provide the most helpful, detailed support possible.
''';
  }
  
  List<Map<String, dynamic>> _buildContextFromMaterials(List<Map<String, dynamic>> materials) {
    final context = <Map<String, dynamic>>[];
    
    for (final material in materials.take(5)) { // Limit to top 5 most relevant
      context.add({
        'role': 'assistant',
        'content': '''
Material: ${material['title']}
Category: ${material['category']}
Type: ${material['type']?.toUpperCase()}
Machine Model: ${material['machine_model'] ?? 'General'}
Description: ${material['description']}
Available: ${material['is_local'] == true ? 'Local' : 'Remote'}
''',
      });
    }
    
    return context;
  }
  
  Future<String> generateTroubleshootingGuide({
    required String machineModel,
    required String issue,
    required String serialNumber,
  }) async {
    final systemPrompt = '''
You are a technical support specialist for Stealth Machine Tools. Generate a comprehensive troubleshooting guide for the specified machine and issue.

Include:
1. Initial diagnosis steps
2. Common causes and solutions
3. Safety precautions
4. When to contact support
5. Preventive measures
''';
    
    final message = '''
Generate a troubleshooting guide for:
- Machine Model: $machineModel
- Issue: $issue
- Serial Number: $serialNumber

Please provide a step-by-step guide that a technician can follow.
''';
    
    return await sendMessage(
      message: message,
      systemPrompt: systemPrompt,
    );
  }
  
  Future<String> getInstallationInstructions({
    required String machineModel,
    required String installationType,
  }) async {
    final systemPrompt = '''
You are a technical installation specialist for Stealth Machine Tools. Provide detailed installation instructions for laser cutting equipment.

Always include:
1. Safety requirements and PPE
2. Pre-installation checks
3. Step-by-step installation process
4. Calibration procedures
5. Testing and verification
6. Common issues and solutions
''';
    
    final message = '''
Provide installation instructions for:
- Machine Model: $machineModel
- Installation Type: $installationType

Include all necessary steps, safety requirements, and troubleshooting tips.
''';
    
    return await sendMessage(
      message: message,
      systemPrompt: systemPrompt,
    );
  }
  
  Future<String> analyzeMachineData({
    required String machineId,
    required Map<String, dynamic> sensorData,
  }) async {
    final systemPrompt = '''
You are a machine diagnostics specialist. Analyze sensor data and machine parameters to identify potential issues or maintenance needs.

Look for:
1. Abnormal readings or patterns
2. Trends indicating wear or failure
3. Performance optimization opportunities
4. Maintenance recommendations
5. Safety concerns
''';
    
        final message = '''
Analyze the following machine data for machine ID: $machineId

Sensor Data:
${const JsonEncoder.withIndent('  ').convert(sensorData)}

Provide analysis and recommendations.
''';
    
    return await sendMessage(
      message: message,
      systemPrompt: systemPrompt,
    );
  }
  
  Future<String> predictMaintenanceNeeds({
    required String machineId,
    required Map<String, dynamic> usageData,
  }) async {
    final systemPrompt = '''
You are a predictive maintenance specialist. Analyze usage patterns and machine data to predict maintenance needs.

Consider:
1. Operating hours and cycles
2. Environmental conditions
3. Historical maintenance records
4. Manufacturer recommendations
5. Critical component wear patterns
''';
    
        final message = '''
Predict maintenance needs for machine ID: $machineId

Usage Data:
${const JsonEncoder.withIndent('  ').convert(usageData)}

Provide maintenance schedule and recommendations.
''';
    
    return await sendMessage(
      message: message,
      systemPrompt: systemPrompt,
    );
  }
  
  Future<List<String>> suggestParts({
    required String machineModel,
    required String issue,
  }) async {
    final systemPrompt = '''
You are a parts specialist for Stealth Machine Tools. Suggest replacement parts based on machine model and issue description.

Consider:
1. Most likely failed components
2. Related parts that should be replaced together
3. Part availability and alternatives
4. Cost considerations
5. Installation requirements
''';
    
    final message = '''
Suggest replacement parts for:
- Machine Model: $machineModel
- Issue: $issue

Provide a prioritized list of parts with brief descriptions.
''';
    
    final response = await sendMessage(
      message: message,
      systemPrompt: systemPrompt,
    );
    
    // Parse response to extract parts list
    final lines = response.split('\n');
    final parts = <String>[];
    
    for (final line in lines) {
      if (line.trim().isNotEmpty && 
          (line.contains('•') || line.contains('-') || line.contains('1.') || line.contains('2.'))) {
        parts.add(line.trim());
      }
    }
    
    return parts;
  }
  
  Future<String> generateSafetyReminder({
    required String machineModel,
    required String operation,
  }) async {
    final systemPrompt = '''
You are a safety specialist for industrial laser cutting equipment. Generate safety reminders and protocols.

Always emphasize:
1. Personal protective equipment (PPE)
2. Machine safety interlocks
3. Proper ventilation requirements
4. Emergency procedures
5. Training requirements
''';
    
    final message = '''
Generate a safety reminder for:
- Machine Model: $machineModel
- Operation: $operation

Include all critical safety requirements and warnings.
''';
    
    return await sendMessage(
      message: message,
      systemPrompt: systemPrompt,
    );
  }
}

// Provider for Anthropic Service - DEPRECATED, use aiChatServiceProvider instead
@Deprecated('Use aiChatServiceProvider from ai_chat_service.dart instead')
final anthropicServiceProvider = Provider<AIChatService>((ref) {
  return ref.watch(aiChatServiceProvider);
});
