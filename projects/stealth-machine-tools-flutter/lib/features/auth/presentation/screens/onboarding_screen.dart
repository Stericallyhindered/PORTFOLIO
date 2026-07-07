import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/smt_theme.dart';
import '../../../../core/services/api_service.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final List<GlobalKey<FormState>> _formKeys = [
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
  ];

  // Personal Information
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _companyController = TextEditingController();
  final _phoneController = TextEditingController();
  final _industryController = TextEditingController();

  // Machine Information
  String? _selectedMachineModel;
  final _serialNumberController = TextEditingController();
  final _purchaseDateController = TextEditingController();
  DateTime? _purchaseDate;
  final _dealerController = TextEditingController();
  String? _machineCondition;

  // Preferences
  bool _receiveNotifications = true;
  bool _receiveMaintenanceReminders = true;
  bool _receiveProductUpdates = false;
  String? _preferredContactMethod;
  String? _timezone;

  final List<String> _machineModels = [
    'SS1510 Compact Type Fiber Laser',
    'S1660 Max Fiber Laser',
    'SMT-2000 Press Brake',
    'SMT-3000 Tube Laser',
    'SMT-4000 Fiber Laser',
    'SMT-5000 Press Brake',
    'Other',
  ];

  final List<String> _industries = [
    'Manufacturing',
    'Automotive',
    'Aerospace',
    'Construction',
    'Metal Fabrication',
    'Job Shop',
    'Other',
  ];

  final List<String> _contactMethods = [
    'Email',
    'Phone',
    'SMS',
    'App Notification',
  ];

  final List<String> _conditions = [
    'New',
    'Like New',
    'Good',
    'Fair',
    'Needs Maintenance',
  ];

  @override
  void dispose() {
    _pageController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _companyController.dispose();
    _phoneController.dispose();
    _industryController.dispose();
    _serialNumberController.dispose();
    _purchaseDateController.dispose();
    _dealerController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_formKeys[_currentPage].currentState!.validate()) {
      if (_currentPage < 2) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        );
      } else {
        _completeOnboarding();
      }
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _completeOnboarding() async {
    try {
      // Submit onboarding data to backend
      final apiService = ref.read(apiServiceProvider);
      
      await apiService.addMachine(
        model: _selectedMachineModel!,
        serialNumber: _serialNumberController.text.trim(),
        purchaseDate: _purchaseDate!.toIso8601String(),
      );

      if (mounted) {
        context.go('/customer/dashboard');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error completing onboarding: ${e.toString()}'),
            backgroundColor: SMTTheme.primaryRed,
          ),
        );
      }
    }
  }

  Future<void> _selectPurchaseDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    
    if (date != null) {
      setState(() {
        _purchaseDate = date;
        _purchaseDateController.text = '${date.day}/${date.month}/${date.year}';
      });
    }
  }

  String? _validateRequired(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  String? _validateEmail(String? value) {
    if (value != null && value.isNotEmpty) {
      if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
        return 'Please enter a valid email';
      }
    }
    return null;
  }

  String? _validatePhone(String? value) {
    if (value != null && value.isNotEmpty) {
      if (!RegExp(r'^\+?[\d\s\-\(\)]{10,}$').hasMatch(value)) {
        return 'Please enter a valid phone number';
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: SMTTheme.darkHeaderGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
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
                                color: SMTTheme.primaryRed.withOpacity(0.3),
                                blurRadius: 10,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.settings,
                            size: 30,
                            color: SMTTheme.primaryRed,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Welcome to SMT',
                                style: SMTTheme.heading2.copyWith(
                                  color: SMTTheme.primaryWhite,
                                ),
                              ),
                              Text(
                                'Let\'s get you set up',
                                style: SMTTheme.bodyMedium.copyWith(
                                  color: SMTTheme.lightGrey2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Progress Indicator
                    Row(
                      children: List.generate(3, (index) {
                        return Expanded(
                          child: Container(
                            height: 4,
                            margin: EdgeInsets.only(
                              right: index < 2 ? 8 : 0,
                            ),
                            decoration: BoxDecoration(
                              color: index <= _currentPage
                                  ? SMTTheme.primaryRed
                                  : SMTTheme.primaryGrey.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        );
                      }),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    Text(
                      _getPageTitle(_currentPage),
                      style: SMTTheme.bodyLarge.copyWith(
                        color: SMTTheme.primaryWhite,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Content
              Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 24),
                  decoration: BoxDecoration(
                    color: SMTTheme.primaryWhite,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(24),
                      topRight: Radius.circular(24),
                    ),
                  ),
                  child: PageView(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    children: [
                      _buildPersonalInfoPage(),
                      _buildMachineInfoPage(),
                      _buildPreferencesPage(),
                    ],
                  ),
                ),
              ),
              
              // Navigation Buttons
              Container(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    if (_currentPage > 0)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _previousPage,
                          style: SMTButtonStyles.secondaryButton,
                          child: const Text('Back'),
                        ),
                      ),
                    if (_currentPage > 0) const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _nextPage,
                        style: SMTButtonStyles.primaryButton,
                        child: Text(_currentPage == 2 ? 'Complete Setup' : 'Next'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPersonalInfoPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKeys[0],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),
            
            Text(
              'Tell us about yourself',
              style: SMTTheme.heading3,
            ),
            
            const SizedBox(height: 8),
            
            Text(
              'This information helps us provide better support',
              style: SMTTheme.bodyMedium.copyWith(
                color: SMTTheme.primaryGrey,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Name Fields
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _firstNameController,
                    textInputAction: TextInputAction.next,
                    validator: (value) => _validateRequired(value, 'First name'),
                    decoration: InputDecoration(
                      labelText: 'First Name',
                      prefixIcon: const Icon(Icons.person_outline),
                      filled: true,
                      fillColor: SMTTheme.lightGrey,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _lastNameController,
                    textInputAction: TextInputAction.next,
                    validator: (value) => _validateRequired(value, 'Last name'),
                    decoration: InputDecoration(
                      labelText: 'Last Name',
                      filled: true,
                      fillColor: SMTTheme.lightGrey,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Company Field
            TextFormField(
              controller: _companyController,
              textInputAction: TextInputAction.next,
              validator: (value) => _validateRequired(value, 'Company name'),
              decoration: InputDecoration(
                labelText: 'Company Name',
                prefixIcon: const Icon(Icons.business_outlined),
                filled: true,
                fillColor: SMTTheme.lightGrey,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Phone Field
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              validator: _validatePhone,
              decoration: InputDecoration(
                labelText: 'Phone Number',
                prefixIcon: const Icon(Icons.phone_outlined),
                filled: true,
                fillColor: SMTTheme.lightGrey,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Industry Dropdown
            DropdownButtonFormField<String>(
              value: _industryController.text.isEmpty ? null : _industryController.text,
              decoration: InputDecoration(
                labelText: 'Industry',
                prefixIcon: const Icon(Icons.work_outline),
                filled: true,
                fillColor: SMTTheme.lightGrey,
              ),
              items: _industries.map((industry) {
                return DropdownMenuItem(
                  value: industry,
                  child: Text(industry),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _industryController.text = value ?? '';
                });
              },
              validator: (value) => _validateRequired(value, 'Industry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMachineInfoPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKeys[1],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),
            
            Text(
              'Machine Information',
              style: SMTTheme.heading3,
            ),
            
            const SizedBox(height: 8),
            
            Text(
              'Tell us about your SMT machine',
              style: SMTTheme.bodyMedium.copyWith(
                color: SMTTheme.primaryGrey,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Machine Model Dropdown
            DropdownButtonFormField<String>(
              value: _selectedMachineModel,
              decoration: InputDecoration(
                labelText: 'Machine Model',
                prefixIcon: const Icon(Icons.precision_manufacturing_outlined),
                filled: true,
                fillColor: SMTTheme.lightGrey,
              ),
              items: _machineModels.map((model) {
                return DropdownMenuItem(
                  value: model,
                  child: Text(model),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedMachineModel = value;
                });
              },
              validator: (value) => _validateRequired(value, 'Machine model'),
            ),
            
            const SizedBox(height: 16),
            
            // Serial Number
            TextFormField(
              controller: _serialNumberController,
              textInputAction: TextInputAction.next,
              validator: (value) => _validateRequired(value, 'Serial number'),
              decoration: InputDecoration(
                labelText: 'Serial Number',
                prefixIcon: const Icon(Icons.tag_outlined),
                filled: true,
                fillColor: SMTTheme.lightGrey,
                helperText: 'Found on the machine\'s identification plate',
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Purchase Date
            TextFormField(
              controller: _purchaseDateController,
              readOnly: true,
              onTap: _selectPurchaseDate,
              validator: (value) => _validateRequired(value, 'Purchase date'),
              decoration: InputDecoration(
                labelText: 'Purchase Date',
                prefixIcon: const Icon(Icons.calendar_today_outlined),
                filled: true,
                fillColor: SMTTheme.lightGrey,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Dealer
            TextFormField(
              controller: _dealerController,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(
                labelText: 'Dealer/Distributor (Optional)',
                prefixIcon: const Icon(Icons.store_outlined),
                filled: true,
                fillColor: SMTTheme.lightGrey,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Machine Condition
            DropdownButtonFormField<String>(
              value: _machineCondition,
              decoration: InputDecoration(
                labelText: 'Machine Condition',
                prefixIcon: const Icon(Icons.assessment_outlined),
                filled: true,
                fillColor: SMTTheme.lightGrey,
              ),
              items: _conditions.map((condition) {
                return DropdownMenuItem(
                  value: condition,
                  child: Text(condition),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _machineCondition = value;
                });
              },
              validator: (value) => _validateRequired(value, 'Machine condition'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreferencesPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKeys[2],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),
            
            Text(
              'Communication Preferences',
              style: SMTTheme.heading3,
            ),
            
            const SizedBox(height: 8),
            
            Text(
              'How would you like to stay connected?',
              style: SMTTheme.bodyMedium.copyWith(
                color: SMTTheme.primaryGrey,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Notification Preferences
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Notifications',
                      style: SMTTheme.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    SwitchListTile(
                      title: const Text('Receive Notifications'),
                      subtitle: const Text('Get updates about your machine'),
                      value: _receiveNotifications,
                      onChanged: (value) {
                        setState(() {
                          _receiveNotifications = value;
                        });
                      },
                      activeColor: SMTTheme.primaryRed,
                    ),
                    
                    SwitchListTile(
                      title: const Text('Maintenance Reminders'),
                      subtitle: const Text('Get notified about scheduled maintenance'),
                      value: _receiveMaintenanceReminders,
                      onChanged: (value) {
                        setState(() {
                          _receiveMaintenanceReminders = value;
                        });
                      },
                      activeColor: SMTTheme.primaryRed,
                    ),
                    
                    SwitchListTile(
                      title: const Text('Product Updates'),
                      subtitle: const Text('Learn about new features and products'),
                      value: _receiveProductUpdates,
                      onChanged: (value) {
                        setState(() {
                          _receiveProductUpdates = value;
                        });
                      },
                      activeColor: SMTTheme.primaryRed,
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Preferred Contact Method
            DropdownButtonFormField<String>(
              value: _preferredContactMethod,
              decoration: InputDecoration(
                labelText: 'Preferred Contact Method',
                prefixIcon: const Icon(Icons.contact_support_outlined),
                filled: true,
                fillColor: SMTTheme.lightGrey,
              ),
              items: _contactMethods.map((method) {
                return DropdownMenuItem(
                  value: method,
                  child: Text(method),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _preferredContactMethod = value;
                });
              },
            ),
            
            const SizedBox(height: 16),
            
            // Timezone
            DropdownButtonFormField<String>(
              value: _timezone,
              decoration: InputDecoration(
                labelText: 'Timezone',
                prefixIcon: const Icon(Icons.access_time_outlined),
                filled: true,
                fillColor: SMTTheme.lightGrey,
              ),
              items: [
                'America/New_York',
                'America/Chicago',
                'America/Denver',
                'America/Los_Angeles',
                'America/Phoenix',
                'America/Anchorage',
                'Pacific/Honolulu',
              ].map((tz) {
                return DropdownMenuItem(
                  value: tz,
                  child: Text(tz),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _timezone = value;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  String _getPageTitle(int page) {
    switch (page) {
      case 0:
        return 'Personal Information';
      case 1:
        return 'Machine Details';
      case 2:
        return 'Preferences';
      default:
        return '';
    }
  }
}
