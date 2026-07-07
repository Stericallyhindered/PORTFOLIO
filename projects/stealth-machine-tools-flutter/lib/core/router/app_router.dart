import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/shared/presentation/screens/main_app_screen.dart';
import '../../features/support_materials/presentation/screens/support_materials_screen.dart';
import '../../features/chat/presentation/screens/enhanced_chat_screen.dart';
import '../../features/shared/presentation/screens/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      // Main App with Bottom Navigation
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const MainAppScreen(),
      ),
      
      // Individual screens (for direct navigation)
      GoRoute(
        path: '/support',
        name: 'support_materials',
        builder: (context, state) => const SupportMaterialsScreen(),
      ),
      
      GoRoute(
        path: '/chat',
        name: 'chat_support',
        builder: (context, state) => const EnhancedChatScreen(),
      ),
      
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              state.error.toString(),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});