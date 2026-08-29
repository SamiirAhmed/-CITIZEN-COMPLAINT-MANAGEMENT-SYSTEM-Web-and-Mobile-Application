import 'package:flutter/material.dart';

import '../../application/application_theme.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.status,
  });

  final String status;

  Color get _color {
    final value = status.toLowerCase();
    if (value.contains('reject') || value.contains('error')) {
      return AppColors.error;
    }
    if (value.contains('closed') ||
        value.contains('resolved') ||
        value.contains('completed') ||
        value.contains('verified')) {
      return AppColors.success;
    }
    if (value.contains('investigation') ||
        value.contains('review') ||
        value.contains('assigned') ||
        value.contains('reopened') ||
        value.contains('warning')) {
      return AppColors.warning;
    }
    return AppColors.info;
  }

  @override
  Widget build(BuildContext context) {
    final color = _color;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
