import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

class SpeechState {
  final bool isListening;
  final bool isSpeaking;
  final String recognizedText;
  final String error;
  final bool isAvailable;

  const SpeechState({
    this.isListening = false,
    this.isSpeaking = false,
    this.recognizedText = '',
    this.error = '',
    this.isAvailable = false,
  });

  SpeechState copyWith({
    bool? isListening,
    bool? isSpeaking,
    String? recognizedText,
    String? error,
    bool? isAvailable,
  }) {
    return SpeechState(
      isListening: isListening ?? this.isListening,
      isSpeaking: isSpeaking ?? this.isSpeaking,
      recognizedText: recognizedText ?? this.recognizedText,
      error: error ?? this.error,
      isAvailable: isAvailable ?? this.isAvailable,
    );
  }
}

class SpeechService extends StateNotifier<SpeechState> {
  late stt.SpeechToText _speechToText;
  bool _ttsAvailable = false;
  
  SpeechService() : super(const SpeechState()) {
    _speechToText = stt.SpeechToText();
    _initializeServices();
  }

  static Future<void> initialize() async {
    print('Speech Service initialized');
  }

  bool get _isTTSSupported {
    if (kIsWeb) return false;
    // TTS plugin requires ATL on Windows, so disable it there
    if (Platform.isWindows) return false;
    return true;
  }

  Future<void> _initializeServices() async {
    await _initializeSpeechToText();
    if (_isTTSSupported) {
      await _initializeTextToSpeech();
    } else {
      print('TTS not available on this platform');
    }
  }

  Future<void> _initializeSpeechToText() async {
    try {
      bool available = await _speechToText.initialize(
        onStatus: (status) {
          if (status == 'listening') {
            state = state.copyWith(isListening: true, error: '');
          } else if (status == 'notListening') {
            state = state.copyWith(isListening: false);
          } else if (status == 'error') {
            state = state.copyWith(
              isListening: false,
              error: 'Speech recognition error',
            );
          }
        },
        onError: (error) {
          state = state.copyWith(
            isListening: false,
            error: 'Error: ${error.errorMsg}',
          );
        },
      );
      
      state = state.copyWith(isAvailable: available);
    } catch (e) {
      state = state.copyWith(
        isAvailable: false,
        error: 'Failed to initialize speech recognition: ${e.toString()}',
      );
    }
  }

  Future<void> _initializeTextToSpeech() async {
    // TTS initialization is platform-specific
    // On Windows, this requires ATL which may not be available
    _ttsAvailable = _isTTSSupported;
  }

  Future<void> startListening({
    String? localeId,
    Duration? timeout,
    Duration? pauseFor,
    Duration? listenFor,
  }) async {
    if (!state.isAvailable) {
      state = state.copyWith(error: 'Speech recognition not available');
      return;
    }

    if (state.isListening) {
      await stopListening();
    }

    try {
      await _speechToText.listen(
        onResult: (result) {
          state = state.copyWith(
            recognizedText: result.recognizedWords,
            error: '',
          );
        },
        localeId: localeId ?? 'en_US',
        listenFor: listenFor ?? const Duration(seconds: 30),
        pauseFor: pauseFor ?? const Duration(seconds: 3),
        partialResults: true,
        cancelOnError: true,
        listenMode: stt.ListenMode.confirmation,
      );
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to start listening: ${e.toString()}',
      );
    }
  }

  Future<void> stopListening() async {
    await _speechToText.stop();
    state = state.copyWith(isListening: false);
  }

  Future<void> cancelListening() async {
    await _speechToText.cancel();
    state = state.copyWith(
      isListening: false,
      recognizedText: '',
    );
  }

  Future<void> speak(String text, {
    double? rate,
    double? volume,
    double? pitch,
  }) async {
    if (text.isEmpty) return;
    
    if (!_ttsAvailable) {
      print('TTS not available on this platform: $text');
      return;
    }

    // TTS functionality disabled for Windows compatibility
    // On mobile platforms, this would use flutter_tts
    print('TTS: $text');
  }

  Future<void> stopSpeaking() async {
    state = state.copyWith(isSpeaking: false);
  }

  Future<void> pauseSpeaking() async {
    // No-op when TTS is disabled
  }

  Future<void> setLanguage(String language) async {
    try {
      await _speechToText.initialize();
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to set language: ${e.toString()}',
      );
    }
  }

  Future<List<stt.LocaleName>> getAvailableLanguages() async {
    try {
      return await _speechToText.locales();
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to get available languages: ${e.toString()}',
      );
      return [];
    }
  }

  Future<void> setSpeechRate(double rate) async {
    // No-op when TTS is disabled
  }

  Future<void> setVolume(double volume) async {
    // No-op when TTS is disabled
  }

  Future<void> setPitch(double pitch) async {
    // No-op when TTS is disabled
  }

  void clearRecognizedText() {
    state = state.copyWith(recognizedText: '');
  }

  void clearError() {
    state = state.copyWith(error: '');
  }

  // Utility methods for specific use cases
  Future<void> startKnowledgeCaptureListening() async {
    await startListening(
      listenFor: const Duration(minutes: 5),
      pauseFor: const Duration(seconds: 5),
    );
  }

  Future<void> startQuickChatListening() async {
    await startListening(
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 2),
    );
  }

  Future<void> speakAIResponse(String response) async {
    String cleanResponse = response
        .replaceAll(RegExp(r'[*_`]'), '')
        .replaceAll(RegExp(r'\n+'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    
    await speak(cleanResponse, rate: 0.5);
  }

  Future<void> speakSafetyReminder(String reminder) async {
    await speak('Safety reminder: $reminder', rate: 0.4);
  }

  Future<void> speakInstructions(List<String> instructions) async {
    for (int i = 0; i < instructions.length; i++) {
      await speak('Step ${i + 1}: ${instructions[i]}');
      await Future.delayed(const Duration(seconds: 1));
    }
  }

  // Voice command processing
  bool isVoiceCommand(String text) {
    final commands = [
      'help',
      'troubleshoot',
      'install',
      'maintenance',
      'parts',
      'manual',
      'safety',
      'emergency',
      'stop',
      'repeat',
    ];
    
    final lowerText = text.toLowerCase();
    return commands.any((command) => lowerText.contains(command));
  }

  String? extractMachineModel(String text) {
    final models = [
      'SS1510',
      'S1660',
      'S1660 Max',
      'SMT-2000',
      'SMT-3000',
      'Fiber Laser',
      'Press Brake',
      'Tube Laser',
    ];
    
    final lowerText = text.toLowerCase();
    for (final model in models) {
      if (lowerText.contains(model.toLowerCase())) {
        return model;
      }
    }
    return null;
  }

  String? extractIssue(String text) {
    final issues = [
      'not cutting',
      'cutting poorly',
      'alignment',
      'calibration',
      'error code',
      'won\'t start',
      'overheating',
      'noise',
      'vibration',
      'quality issues',
    ];
    
    final lowerText = text.toLowerCase();
    for (final issue in issues) {
      if (lowerText.contains(issue)) {
        return issue;
      }
    }
    return null;
  }
}

// Providers
final speechServiceProvider = StateNotifierProvider<SpeechService, SpeechState>((ref) {
  return SpeechService();
});

final isListeningProvider = Provider<bool>((ref) {
  return ref.watch(speechServiceProvider).isListening;
});

final isSpeakingProvider = Provider<bool>((ref) {
  return ref.watch(speechServiceProvider).isSpeaking;
});

final recognizedTextProvider = Provider<String>((ref) {
  return ref.watch(speechServiceProvider).recognizedText;
});

final speechErrorProvider = Provider<String>((ref) {
  return ref.watch(speechServiceProvider).error;
});
