import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/smt_theme.dart';
import '../../../../core/widgets/smt_logo.dart';
import '../../../../core/services/auth_service.dart';
import '../widgets/admin_dashboard_stats.dart';
import '../widgets/recent_activity_card.dart';
import '../widgets/quick_actions_card.dart';
import 'support_tickets_screen.dart';
import 'machine_registry_screen.dart';
import 'training_modules_screen.dart';
import 'parts_catalog_screen.dart';
import 'system_settings_screen.dart';
import '../widgets/member_management_section.dart';
import '../widgets/system_overview_card.dart';
import '../screens/content_management_screen.dart';
import '../screens/analytics_screen.dart';
import '../screens/admin_management_screen.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: SMTTheme.lightGrey,
      appBar: AppBar(
        backgroundColor: SMTTheme.primaryWhite,
        elevation: 0,
        leading: const SMTAppBarLogo(),
        title: const Text(
          'Admin Dashboard',
          style: TextStyle(
            color: SMTTheme.primaryBlack,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: SMTTheme.primaryBlack),
            onPressed: () {
              // TODO: Show notifications
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.account_circle, color: SMTTheme.primaryBlack),
            onSelected: (value) {
              switch (value) {
                case 'profile':
                  context.go('/profile');
                  break;
                case 'settings':
                  context.go('/settings');
                  break;
                case 'logout':
                  _showLogoutDialog();
                  break;
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(Icons.person_outline, color: SMTTheme.primaryBlack),
                    const SizedBox(width: 8),
                    const Text('Profile'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings_outlined, color: SMTTheme.primaryBlack),
                    const SizedBox(width: 8),
                    const Text('Settings'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Logout', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Row(
        children: [
          // Sidebar Navigation
          Container(
            width: 280,
            color: SMTTheme.primaryWhite,
            child: Column(
              children: [
                const SizedBox(height: 20),
                // Welcome Section
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: SMTTheme.lightGrey,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome back,',
                        style: SMTTheme.bodyMedium.copyWith(
                          color: SMTTheme.darkGrey,
                        ),
                      ),
                      Text(
                        user?.firstName ?? 'Admin',
                        style: SMTTheme.heading3.copyWith(
                          color: SMTTheme.primaryBlack,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'System Administrator',
                        style: SMTTheme.bodySmall.copyWith(
                          color: SMTTheme.primaryRed,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                // Navigation Menu
                Expanded(
                  child: ListView(
                    children: [
                      _buildNavItem(
                        icon: Icons.dashboard_outlined,
                        title: 'Dashboard',
                        isSelected: _selectedIndex == 0,
                        onTap: () => setState(() => _selectedIndex = 0),
                      ),
                      _buildNavItem(
                        icon: Icons.people_outline,
                        title: 'Member Management',
                        isSelected: _selectedIndex == 1,
                        onTap: () => setState(() => _selectedIndex = 1),
                      ),
                      _buildNavItem(
                        icon: Icons.admin_panel_settings_outlined,
                        title: 'Admin Management',
                        isSelected: _selectedIndex == 2,
                        onTap: () => setState(() => _selectedIndex = 2),
                      ),
                      _buildNavItem(
                        icon: Icons.article_outlined,
                        title: 'Content Management',
                        isSelected: _selectedIndex == 3,
                        onTap: () => setState(() => _selectedIndex = 3),
                      ),
                      _buildNavItem(
                        icon: Icons.analytics_outlined,
                        title: 'Analytics',
                        isSelected: _selectedIndex == 4,
                        onTap: () => setState(() => _selectedIndex = 4),
                      ),
                      _buildNavItem(
                        icon: Icons.support_agent_outlined,
                        title: 'Support Tickets',
                        isSelected: _selectedIndex == 5,
                        onTap: () => setState(() => _selectedIndex = 5),
                      ),
                      _buildNavItem(
                        icon: Icons.precision_manufacturing_outlined,
                        title: 'Machine Registry',
                        isSelected: _selectedIndex == 6,
                        onTap: () => setState(() => _selectedIndex = 6),
                      ),
                      _buildNavItem(
                        icon: Icons.school_outlined,
                        title: 'Training Modules',
                        isSelected: _selectedIndex == 7,
                        onTap: () => setState(() => _selectedIndex = 7),
                      ),
                      _buildNavItem(
                        icon: Icons.inventory_2_outlined,
                        title: 'Parts Catalog',
                        isSelected: _selectedIndex == 8,
                        onTap: () => setState(() => _selectedIndex = 8),
                      ),
                      _buildNavItem(
                        icon: Icons.settings_outlined,
                        title: 'System Settings',
                        isSelected: _selectedIndex == 9,
                        onTap: () => setState(() => _selectedIndex = 9),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Main Content Area
          Expanded(
            child: _buildMainContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      child: ListTile(
        leading: Icon(
          icon,
          color: isSelected ? SMTTheme.primaryWhite : SMTTheme.darkGrey,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected ? SMTTheme.primaryWhite : SMTTheme.primaryBlack,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        selected: isSelected,
        selectedTileColor: SMTTheme.primaryRed,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        onTap: onTap,
      ),
    );
  }

  Widget _buildMainContent() {
    switch (_selectedIndex) {
      case 0:
        return _buildDashboardContent();
      case 1:
        return const MemberManagementSection();
      case 2:
        return const AdminManagementScreen();
      case 3:
        return const ContentManagementScreen();
      case 4:
        return const AnalyticsScreen();
      case 5:
        return _buildSupportTicketsContent();
      case 6:
        return _buildMachineRegistryContent();
      case 7:
        return _buildTrainingModulesContent();
      case 8:
        return _buildPartsCatalogContent();
      case 9:
        return _buildSystemSettingsContent();
      default:
        return _buildDashboardContent();
    }
  }

  Widget _buildDashboardContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Page Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'System Overview',
                    style: SMTTheme.heading1.copyWith(
                      color: SMTTheme.primaryBlack,
                    ),
                  ),
                  Text(
                    'Monitor and manage your CNC machine tool operations',
                    style: SMTTheme.bodyLarge.copyWith(
                      color: SMTTheme.darkGrey,
                    ),
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: () {
                  // TODO: Refresh data
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Refresh Data'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: SMTTheme.primaryRed,
                  foregroundColor: SMTTheme.primaryWhite,
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          
          // System Overview Cards
          const SystemOverviewCard(),
          const SizedBox(height: 24),
          
          // Stats Grid
          const AdminDashboardStats(),
          const SizedBox(height: 24),
          
          // Quick Actions and Recent Activity
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 2,
                child: QuickActionsCard(
                  onAddCustomer: () => setState(() => _selectedIndex = 1),
                  onAddEmployee: () => setState(() => _selectedIndex = 1),
                  onViewAnalytics: () => setState(() => _selectedIndex = 4),
                  onManageContent: () => setState(() => _selectedIndex = 3),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 1,
                child: RecentActivityCard(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSupportTicketsContent() {
    return const SupportTicketsScreen();
  }

  Widget _buildMachineRegistryContent() {
    return const MachineRegistryScreen();
  }

  Widget _buildTrainingModulesContent() {
    return const TrainingModulesScreen();
  }

  Widget _buildPartsCatalogContent() {
    return const PartsCatalogScreen();
  }

  Widget _buildSystemSettingsContent() {
    return const SystemSettingsScreen();
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(authServiceProvider.notifier).logout();
              context.go('/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: SMTTheme.primaryRed,
              foregroundColor: SMTTheme.primaryWhite,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}