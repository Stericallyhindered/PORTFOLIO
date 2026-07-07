import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../models/machine_model.dart';
import '../models/support_ticket_model.dart';
import '../models/chat_message_model.dart';
import '../models/training_module_model.dart';
import 'github_api_service.dart';

class DatabaseService {
  static GitHubApiService? _githubApiService;

  static Future<void> initialize() async {
    // Initialize GitHub API service
    _githubApiService = GitHubApiService.withDefaults();
    print('Database service initialized with GitHub API');
  }

  // User operations
  static Future<UserModel?> getUserByEmail(String email) async {
    try {
      return await _githubApiService?.getUserByEmail(email);
    } catch (e) {
      print('Error getting user by email: $e');
      return null;
    }
  }

  static Future<UserModel?> getUserById(String id) async {
    try {
      return await _githubApiService?.getUserById(id);
    } catch (e) {
      print('Error getting user by id: $e');
      return null;
    }
  }

  static Future<List<UserModel>> getAllUsers() async {
    try {
      return await _githubApiService?.getAllUsers() ?? [];
    } catch (e) {
      print('Error getting all users: $e');
      return [];
    }
  }

  static Future<void> createUser(UserModel user) async {
    try {
      await _githubApiService?.createUser(user);
    } catch (e) {
      print('Error creating user: $e');
      throw e;
    }
  }

  static Future<void> updateUser(UserModel user) async {
    try {
      await _githubApiService?.updateUser(user);
    } catch (e) {
      print('Error updating user: $e');
      throw e;
    }
  }

  static Future<void> deleteUser(String id) async {
    try {
      await _githubApiService?.deleteUser(id);
    } catch (e) {
      print('Error deleting user: $e');
      throw e;
    }
  }

  // Machine operations
  static Future<MachineModel?> getMachineById(String id) async {
    try {
      return await _githubApiService?.getMachineById(id);
    } catch (e) {
      print('Error getting machine by id: $e');
      return null;
    }
  }

  static Future<List<MachineModel>> getAllMachines() async {
    try {
      return await _githubApiService?.getAllMachines() ?? [];
    } catch (e) {
      print('Error getting all machines: $e');
      return [];
    }
  }

  static Future<List<MachineModel>> getMachinesByUserId(String userId) async {
    try {
      return await _githubApiService?.getMachinesByUserId(userId) ?? [];
    } catch (e) {
      print('Error getting machines by user id: $e');
      return [];
    }
  }

  static Future<List<MachineModel>> searchMachines(String query) async {
    try {
      final allMachines = await getAllMachines();
      final lowerQuery = query.toLowerCase();
      return allMachines.where((machine) =>
        machine.model.toLowerCase().contains(lowerQuery) ||
        machine.serialNumber.toLowerCase().contains(lowerQuery) ||
        (machine.location ?? '').toLowerCase().contains(lowerQuery)
      ).toList();
    } catch (e) {
      print('Error searching machines: $e');
      return [];
    }
  }

  static Future<void> createMachine(MachineModel machine) async {
    try {
      await _githubApiService?.createMachine(machine);
    } catch (e) {
      print('Error creating machine: $e');
      throw e;
    }
  }

  static Future<void> updateMachine(MachineModel machine) async {
    try {
      await _githubApiService?.updateMachine(machine);
    } catch (e) {
      print('Error updating machine: $e');
      throw e;
    }
  }

  static Future<void> deleteMachine(String id) async {
    try {
      await _githubApiService?.deleteMachine(id);
    } catch (e) {
      print('Error deleting machine: $e');
      throw e;
    }
  }

  // Support ticket operations
  static Future<SupportTicketModel?> getTicketById(String id) async {
    try {
      return await _githubApiService?.getTicketById(id);
    } catch (e) {
      print('Error getting ticket by id: $e');
      return null;
    }
  }

  static Future<List<SupportTicketModel>> getAllTickets() async {
    try {
      return await _githubApiService?.getAllTickets() ?? [];
    } catch (e) {
      print('Error getting all tickets: $e');
      return [];
    }
  }

  static Future<List<SupportTicketModel>> getTicketsByUserId(String userId) async {
    try {
      return await _githubApiService?.getTicketsByUserId(userId) ?? [];
    } catch (e) {
      print('Error getting tickets by user id: $e');
      return [];
    }
  }

  static Future<List<SupportTicketModel>> getTicketsByMachineId(String machineId) async {
    try {
      return await _githubApiService?.getTicketsByMachineId(machineId) ?? [];
    } catch (e) {
      print('Error getting tickets by machine id: $e');
      return [];
    }
  }

  static Future<void> createTicket(SupportTicketModel ticket) async {
    try {
      await _githubApiService?.createTicket(ticket);
    } catch (e) {
      print('Error creating ticket: $e');
      throw e;
    }
  }

  static Future<void> updateTicket(SupportTicketModel ticket) async {
    try {
      await _githubApiService?.updateTicket(ticket);
    } catch (e) {
      print('Error updating ticket: $e');
      throw e;
    }
  }

  static Future<void> deleteTicket(String id) async {
    try {
      await _githubApiService?.deleteTicket(id);
    } catch (e) {
      print('Error deleting ticket: $e');
      throw e;
    }
  }

  // Chat message operations
  static Future<List<ChatMessageModel>> getChatMessages(String ticketId) async {
    try {
      return await _githubApiService?.getChatMessages(ticketId) ?? [];
    } catch (e) {
      print('Error getting chat messages: $e');
      return [];
    }
  }

  static Future<void> createChatMessage(ChatMessageModel message) async {
    try {
      await _githubApiService?.createChatMessage(message);
    } catch (e) {
      print('Error creating chat message: $e');
      throw e;
    }
  }

  static Future<void> updateChatMessage(ChatMessageModel message) async {
    try {
      await _githubApiService?.updateChatMessage(message);
    } catch (e) {
      print('Error updating chat message: $e');
      throw e;
    }
  }

  static Future<void> deleteChatMessage(String id) async {
    try {
      await _githubApiService?.deleteChatMessage(id);
    } catch (e) {
      print('Error deleting chat message: $e');
      throw e;
    }
  }

  // Training module operations
  static Future<TrainingModuleModel?> getTrainingModuleById(String id) async {
    try {
      return await _githubApiService?.getTrainingModuleById(id);
    } catch (e) {
      print('Error getting training module by id: $e');
      return null;
    }
  }

  static Future<List<TrainingModuleModel>> getAllTrainingModules() async {
    try {
      return await _githubApiService?.getAllTrainingModules() ?? [];
    } catch (e) {
      print('Error getting all training modules: $e');
      return [];
    }
  }

  static Future<List<TrainingModuleModel>> getTrainingModulesByMachine(String machineId) async {
    try {
      final allModules = await getAllTrainingModules();
      return allModules.where((module) =>
        module.machineModel?.contains(machineId) == true || 
        (module.machineModel?.isEmpty ?? true)
      ).toList();
    } catch (e) {
      print('Error getting training modules by machine: $e');
      return [];
    }
  }

  static Future<void> createTrainingModule(TrainingModuleModel module) async {
    try {
      await _githubApiService?.createTrainingModule(module);
    } catch (e) {
      print('Error creating training module: $e');
      throw e;
    }
  }

  static Future<void> updateTrainingModule(TrainingModuleModel module) async {
    try {
      await _githubApiService?.updateTrainingModule(module);
    } catch (e) {
      print('Error updating training module: $e');
      throw e;
    }
  }

  static Future<void> deleteTrainingModule(String id) async {
    try {
      await _githubApiService?.deleteTrainingModule(id);
    } catch (e) {
      print('Error deleting training module: $e');
      throw e;
    }
  }

  // Training progress operations
  static Future<TrainingProgressModel?> getTrainingProgress(String userId, String moduleId) async {
    try {
      return await _githubApiService?.getTrainingProgress(userId, moduleId);
    } catch (e) {
      print('Error getting training progress: $e');
      return null;
    }
  }

  static Future<List<TrainingProgressModel>> getTrainingProgressByUser(String userId) async {
    try {
      return await _githubApiService?.getTrainingProgressByUser(userId) ?? [];
    } catch (e) {
      print('Error getting training progress by user: $e');
      return [];
    }
  }

  static Future<void> createTrainingProgress(TrainingProgressModel progress) async {
    try {
      await _githubApiService?.createTrainingProgress(progress);
    } catch (e) {
      print('Error creating training progress: $e');
      throw e;
    }
  }

  static Future<void> updateTrainingProgress(TrainingProgressModel progress) async {
    try {
      await _githubApiService?.updateTrainingProgress(progress);
    } catch (e) {
      print('Error updating training progress: $e');
      throw e;
    }
  }

  static Future<void> deleteTrainingProgress(String userId, String moduleId) async {
    try {
      await _githubApiService?.deleteTrainingProgress(userId, moduleId);
    } catch (e) {
      print('Error deleting training progress: $e');
      throw e;
    }
  }

  // Analytics
  static Future<Map<String, dynamic>> getAnalytics() async {
    try {
      return await _githubApiService?.getAnalytics() ?? {};
    } catch (e) {
      print('Error getting analytics: $e');
      return {};
    }
  }

  // Cleanup
  static Future<void> close() async {
    // No cleanup needed for GitHub API
    print('Database service closed');
  }
}

// Providers for Riverpod
final databaseServiceProvider = Provider<DatabaseService>((ref) {
  return DatabaseService();
});