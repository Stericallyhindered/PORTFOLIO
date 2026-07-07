import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/database_service.dart';
import '../models/user_model.dart';
import '../models/machine_model.dart';
import '../models/support_ticket_model.dart';
import '../models/chat_message_model.dart';
import '../models/training_module_model.dart';

// Database service provider
final databaseServiceProvider = Provider<DatabaseService>((ref) {
  return DatabaseService();
});

// Users providers
final allUsersProvider = FutureProvider<List<UserModel>>((ref) async {
  return await DatabaseService.getAllUsers();
});

final userProvider = FutureProvider.family<UserModel?, String>((ref, userId) async {
  return await DatabaseService.getUserById(userId);
});

final userByEmailProvider = FutureProvider.family<UserModel?, String>((ref, email) async {
  return await DatabaseService.getUserByEmail(email);
});

// Machines providers
final allMachinesProvider = FutureProvider<List<MachineModel>>((ref) async {
  return await DatabaseService.getAllMachines();
});

final machinesByUserProvider = FutureProvider.family<List<MachineModel>, String>((ref, userId) async {
  return await DatabaseService.getMachinesByUserId(userId);
});

final machineProvider = FutureProvider.family<MachineModel?, String>((ref, machineId) async {
  return await DatabaseService.getMachineById(machineId);
});

final searchMachinesProvider = FutureProvider.family<List<MachineModel>, String>((ref, query) async {
  return await DatabaseService.searchMachines(query);
});

// Support tickets providers
final allTicketsProvider = FutureProvider<List<SupportTicketModel>>((ref) async {
  return await DatabaseService.getAllTickets();
});

final ticketsByUserProvider = FutureProvider.family<List<SupportTicketModel>, String>((ref, userId) async {
  return await DatabaseService.getTicketsByUserId(userId);
});

final ticketsByMachineProvider = FutureProvider.family<List<SupportTicketModel>, String>((ref, machineId) async {
  return await DatabaseService.getTicketsByMachineId(machineId);
});

final ticketProvider = FutureProvider.family<SupportTicketModel?, String>((ref, ticketId) async {
  return await DatabaseService.getTicketById(ticketId);
});

// Chat messages providers
final messagesByTicketProvider = FutureProvider.family<List<ChatMessageModel>, String>((ref, ticketId) async {
  return await DatabaseService.getChatMessages(ticketId);
});

// Training modules providers
final allTrainingModulesProvider = FutureProvider<List<TrainingModuleModel>>((ref) async {
  return await DatabaseService.getAllTrainingModules();
});

final trainingModulesByMachineProvider = FutureProvider.family<List<TrainingModuleModel>, String>((ref, machineId) async {
  return await DatabaseService.getTrainingModulesByMachine(machineId);
});

final trainingModuleProvider = FutureProvider.family<TrainingModuleModel?, String>((ref, moduleId) async {
  return await DatabaseService.getTrainingModuleById(moduleId);
});

// Training progress providers
final trainingProgressByUserProvider = FutureProvider.family<List<TrainingProgressModel>, String>((ref, userId) async {
  return await DatabaseService.getTrainingProgressByUser(userId);
});

final trainingProgressProvider = FutureProvider.family<TrainingProgressModel?, (String, String)>((ref, params) async {
  final (userId, moduleId) = params;
  return await DatabaseService.getTrainingProgress(userId, moduleId);
});

// System analytics provider
final systemAnalyticsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return await DatabaseService.getAnalytics();
});