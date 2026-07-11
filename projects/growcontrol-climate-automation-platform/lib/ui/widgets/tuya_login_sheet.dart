import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import 'tuya_login_panel.dart';

/// Modal bottom-sheet wrapper around [TuyaLoginPanel]. Pop-able so the user
/// can dismiss without signing in — caller uses the returned bool to decide
/// what to do next.
Future<bool?> showTuyaLoginSheet(BuildContext context) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppTheme.bgMid,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
    ),
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
      child: TuyaLoginPanel(
        onComplete: () => Navigator.of(ctx).pop(true),
      ),
    ),
  );
}
