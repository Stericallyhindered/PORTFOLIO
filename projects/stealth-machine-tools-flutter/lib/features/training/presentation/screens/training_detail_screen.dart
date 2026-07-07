import 'package:flutter/material.dart';

import '../../../../core/theme/smt_theme.dart';

class TrainingDetailScreen extends StatelessWidget {
  final String moduleId;
  
  const TrainingDetailScreen({
    super.key,
    required this.moduleId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Training - $moduleId'),
        backgroundColor: SMTTheme.primaryRed,
        foregroundColor: SMTTheme.primaryWhite,
      ),
      body: Center(
        child: Text('Training Detail - Coming Soon'),
      ),
    );
  }
}
