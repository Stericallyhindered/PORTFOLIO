import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/smt_theme.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/services/ai_service.dart';
import '../widgets/machine_card.dart';
import '../widgets/quick_actions_card.dart';
import '../widgets/recent_tickets_card.dart';
import '../widgets/ai_chat_card.dart';
import '../widgets/maintenance_reminder_card.dart';

class CustomerDashboardScreen extends ConsumerStatefulWidget {
  const CustomerDashboardScreen({super.key});

  @override
  ConsumerState<CustomerDashboardScreen> createState() => _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends ConsumerState<CustomerDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showProfileMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: SMTTheme.primaryWhite,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: 12),
              decoration: BoxDecoration(
                color: SMTTheme.lightGrey2,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: const Text('Profile'),
              onTap: () {
                Navigator.pop(context);
                context.push('/profile');
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: const Text('Settings'),
              onTap: () {
                Navigator.pop(context);
                context.push('/settings');
              },
            ),
            ListTile(
              leading: const Icon(Icons.help_outline),
              title: const Text('Help & Support'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Navigate to help
              },
            ),
            ListTile(
              leading: const Icon(Icons.logout, color: SMTTheme.primaryRed),
              title: const Text('Sign Out', style: TextStyle(color: SMTTheme.primaryRed)),
              onTap: () async {
                Navigator.pop(context);
                await ref.read(authServiceProvider.notifier).logout();
                if (mounted) context.go('/login');
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final aiMessages = ref.watch(aiServiceProvider);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: SMTTheme.offWhite,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 200,
              floating: false,
              pinned: true,
              backgroundColor: SMTTheme.primaryRed,
              flexibleSpace: FlexibleSpaceBar(
                title: Text(
                  'Welcome back, ${user?.firstName ?? 'Customer'}',
                  style: SMTTheme.bodyLarge.copyWith(
                    color: SMTTheme.primaryWhite,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                titlePadding: const EdgeInsets.only(left: 16, bottom: 16),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: SMTTheme.redGradient,
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 40),
                          Row(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                decoration: BoxDecoration(
                                  color: SMTTheme.primaryWhite,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: SMTTheme.primaryBlack.withOpacity(0.1),
                                      blurRadius: 10,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.person,
                                  color: SMTTheme.primaryRed,
                                  size: 30,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Stealth Machine Tools',
                                      style: SMTTheme.heading3.copyWith(
                                        color: SMTTheme.primaryWhite,
                                      ),
                                    ),
                                    Text(
                                      'AI-Powered Tech Support',
                                      style: SMTTheme.bodyMedium.copyWith(
                                        color: SMTTheme.lightGrey2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                onPressed: _showProfileMenu,
                                icon: const Icon(
                                  Icons.more_vert,
                                  color: SMTTheme.primaryWhite,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Text(
                            'Your machines are running smoothly',
                            style: SMTTheme.bodyLarge.copyWith(
                              color: SMTTheme.primaryWhite,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              bottom: TabBar(
                controller: _tabController,
                indicatorColor: SMTTheme.primaryWhite,
                indicatorWeight: 3,
                labelColor: SMTTheme.primaryWhite,
                unselectedLabelColor: SMTTheme.lightGrey2,
                tabs: const [
                  Tab(icon: Icon(Icons.dashboard), text: 'Dashboard'),
                  Tab(icon: Icon(Icons.precision_manufacturing), text: 'Machines'),
                  Tab(icon: Icon(Icons.support_agent), text: 'Support'),
                  Tab(icon: Icon(Icons.school), text: 'Training'),
                ],
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildDashboardTab(),
            _buildMachinesTab(),
            _buildSupportTab(),
            _buildTrainingTab(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/customer/chat'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
        icon: const Icon(Icons.chat),
        label: const Text('AI Chat'),
      ),
    );
  }

  Widget _buildDashboardTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Quick Actions
          const QuickActionsCard(),
          
          const SizedBox(height: 16),
          
          // Machine Status Overview
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Machine Status Overview',
                    style: SMTTheme.heading3,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatusCard(
                          'Online',
                          '2',
                          SMTTheme.primaryRed,
                          Icons.check_circle,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatusCard(
                          'Maintenance Due',
                          '1',
                          Colors.orange,
                          Icons.schedule,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatusCard(
                          'Issues',
                          '0',
                          Colors.green,
                          Icons.warning,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatusCard(
                          'Total Machines',
                          '3',
                          SMTTheme.primaryGrey,
                          Icons.inventory,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Recent Tickets
          const RecentTicketsCard(),
          
          const SizedBox(height: 16),
          
          // AI Chat Preview
          const AIChatCard(),
          
          const SizedBox(height: 16),
          
          // Maintenance Reminders
          const MaintenanceReminderCard(),
          
          const SizedBox(height: 80), // Space for FAB
        ],
      ),
    );
  }

  Widget _buildStatusCard(String title, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: SMTTheme.heading2.copyWith(color: color),
          ),
          Text(
            title,
            style: SMTTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMachinesTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Your Machines',
                style: SMTTheme.heading3,
              ),
              TextButton.icon(
                onPressed: () {
                  // TODO: Add new machine
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Add machine feature coming soon'),
                    ),
                  );
                },
                icon: const Icon(Icons.add),
                label: const Text('Add Machine'),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Machine Cards
          const MachineCard(
            machineModel: 'SS1510 Compact Type Fiber Laser',
            serialNumber: 'SMT-SS1510-2024-001',
            status: 'Online',
            lastService: '2024-01-15',
            nextService: '2024-04-15',
            hoursRun: 1247,
          ),
          
          const SizedBox(height: 12),
          
          const MachineCard(
            machineModel: 'S1660 Max Fiber Laser',
            serialNumber: 'SMT-S1660-2023-045',
            status: 'Maintenance Due',
            lastService: '2023-12-01',
            nextService: '2024-01-01',
            hoursRun: 2156,
          ),
          
          const SizedBox(height: 12),
          
          const MachineCard(
            machineModel: 'SMT-2000 Press Brake',
            serialNumber: 'SMT-PB2000-2024-012',
            status: 'Online',
            lastService: '2024-01-10',
            nextService: '2024-04-10',
            hoursRun: 892,
          ),
          
          const SizedBox(height: 80), // Space for FAB
        ],
      ),
    );
  }

  Widget _buildSupportTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Support Options
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Get Help',
                    style: SMTTheme.heading3,
                  ),
                  const SizedBox(height: 16),
                  
                  _buildSupportOption(
                    'AI Chat Support',
                    'Get instant help from our AI assistant',
                    Icons.chat,
                    SMTTheme.primaryRed,
                    () => context.push('/customer/chat'),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildSupportOption(
                    'Create Support Ticket',
                    'Submit a detailed support request',
                    Icons.support_agent,
                    Colors.blue,
                    () => context.push('/customer/tickets'),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildSupportOption(
                    'Emergency Support',
                    '24/7 emergency assistance',
                    Icons.emergency,
                    Colors.red,
                    () {
                      // TODO: Emergency support
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Emergency support: +1-800-SMT-HELP'),
                        ),
                      );
                    },
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildSupportOption(
                    'AR Troubleshooting',
                    'Use your camera for guided troubleshooting',
                    Icons.camera_alt,
                    Colors.purple,
                    () => context.push('/ar/troubleshooting/machine-1'),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Recent Support Activity
          const RecentTicketsCard(),
        ],
      ),
    );
  }

  Widget _buildSupportOption(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: color.withOpacity(0.3)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: SMTTheme.bodyLarge.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: SMTTheme.bodyMedium.copyWith(
                      color: SMTTheme.primaryGrey,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: SMTTheme.primaryGrey,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrainingTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Training Modules',
            style: SMTTheme.heading3,
          ),
          
          const SizedBox(height: 8),
          
          Text(
            'Learn how to operate and maintain your SMT machines',
            style: SMTTheme.bodyMedium.copyWith(
              color: SMTTheme.primaryGrey,
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Training Categories
          Row(
            children: [
              Expanded(
                child: _buildTrainingCategory(
                  'Basic Operations',
                  'Getting started with your machine',
                  Icons.play_circle_outline,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTrainingCategory(
                  'Maintenance',
                  'Keep your machine running smoothly',
                  Icons.build_outlined,
                  Colors.green,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          Row(
            children: [
              Expanded(
                child: _buildTrainingCategory(
                  'Troubleshooting',
                  'Common issues and solutions',
                  Icons.bug_report_outlined,
                  Colors.orange,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTrainingCategory(
                  'Safety',
                  'ANSI/OSHA compliance',
                  Icons.security_outlined,
                  Colors.red,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Recent Training Progress
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Training Progress',
                    style: SMTTheme.heading3,
                  ),
                  const SizedBox(height: 16),
                  
                  _buildTrainingProgress(
                    'SS1510 Basic Operations',
                    75,
                    Colors.blue,
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildTrainingProgress(
                    'Fiber Laser Maintenance',
                    45,
                    Colors.green,
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildTrainingProgress(
                    'Safety Procedures',
                    100,
                    Colors.red,
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 80), // Space for FAB
        ],
      ),
    );
  }

  Widget _buildTrainingCategory(
    String title,
    String subtitle,
    IconData icon,
    Color color,
  ) {
    return InkWell(
      onTap: () => context.push('/training/modules'),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(
              title,
              style: SMTTheme.bodyLarge.copyWith(
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            Text(
              subtitle,
              style: SMTTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrainingProgress(String title, int progress, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: SMTTheme.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              '$progress%',
              style: SMTTheme.bodyMedium.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress / 100,
          backgroundColor: color.withOpacity(0.2),
          valueColor: AlwaysStoppedAnimation<Color>(color),
        ),
      ],
    );
  }
}
