import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../../../models/notification_model.dart';

class NotificationVisual {
  const NotificationVisual({
    required this.icon,
    required this.accent,
    required this.background,
  });

  final IconData icon;
  final Color accent;
  final Color background;
}

const _hiddenTypes = {
  'login_success',
  'login',
  'logout',
  'login_failed',
  'user_login',
  'user_logout',
  'successful_login',
  'user_logged_out',
};

const _hiddenTitlePhrases = [
  'successful login',
  'user logged in',
  'user logged out',
  'failed login',
  'police login',
  'admin login',
  'police logout',
  'admin logout',
  'citizen login',
  'citizen logout',
];

bool isAllowedNotification(AppNotification item) {
  final type = item.type.toLowerCase().trim();
  if (_hiddenTypes.contains(type)) return false;
  if (type.contains('login') || type.contains('logout')) return false;

  final title = item.title.toLowerCase();
  for (final phrase in _hiddenTitlePhrases) {
    if (title.contains(phrase)) return false;
  }

  return true;
}

NotificationVisual visualFor(AppNotification item) {
  final type = item.type.toLowerCase();
  final title = item.title.toLowerCase();

  if (type.contains('reopen') || title.contains('reopen')) {
    return NotificationVisual(
      icon: Icons.replay_rounded,
      accent: const Color(0xFF15803D),
      background: const Color(0xFFDCFCE7),
    );
  }

  if (type.contains('closed') ||
      type.contains('resolved') ||
      title.contains('closed') ||
      title.contains('resolved')) {
    return NotificationVisual(
      icon: Icons.lock_outline_rounded,
      accent: const Color(0xFFDC2626),
      background: const Color(0xFFFEE2E2),
    );
  }

  if (type.contains('investigation_completed') ||
      title.contains('investigation completed')) {
    return NotificationVisual(
      icon: Icons.task_alt_rounded,
      accent: const Color(0xFF0369A1),
      background: const Color(0xFFE0F2FE),
    );
  }

  if (type.contains('investigation') ||
      title.contains('investigation started') ||
      title.contains('investigation update')) {
    return NotificationVisual(
      icon: Icons.manage_search_rounded,
      accent: const Color(0xFF7C3AED),
      background: const Color(0xFFEDE9FE),
    );
  }

  if (type.contains('assigned') ||
      type.contains('police_assigned') ||
      type.contains('reassigned') ||
      title.contains('officer assigned') ||
      title.contains('police officer')) {
    return NotificationVisual(
      icon: Icons.badge_outlined,
      accent: const Color(0xFFD97706),
      background: const Color(0xFFFFEDD5),
    );
  }

  if (type.contains('ob_created') ||
      type.contains('ob_record') ||
      (type.contains('ob') && !type.contains('job'))) {
    return NotificationVisual(
      icon: Icons.folder_copy_outlined,
      accent: const Color(0xFF0F766E),
      background: const Color(0xFFCCFBF1),
    );
  }

  if (type.contains('complaint') || type.contains('evidence')) {
    return NotificationVisual(
      icon: Icons.description_outlined,
      accent: AppColors.spfBlue,
      background: AppColors.spfBlue.withValues(alpha: 0.1),
    );
  }

  if (type.contains('citizen') || type.contains('registered')) {
    return NotificationVisual(
      icon: Icons.person_outline_rounded,
      accent: AppColors.spfBlueLight,
      background: AppColors.spfBlue.withValues(alpha: 0.1),
    );
  }

  return NotificationVisual(
    icon: Icons.notifications_none_rounded,
    accent: AppColors.spfBlue,
    background: AppColors.spfBlue.withValues(alpha: 0.1),
  );
}

String actorLabel(AppNotification item) {
  final name = item.actorName?.trim();
  if (name != null && name.isNotEmpty) {
    return name;
  }

  final role = item.actorRole?.trim();
  if (role != null && role.isNotEmpty) {
    return _formatRole(role);
  }

  return '';
}

String _formatRole(String role) {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'Admin';
    case 'police':
      return 'Police Officer';
    case 'citizen':
      return 'Citizen';
    case 'system':
      return 'System';
    default:
      if (role.isEmpty) return '';
      return role[0].toUpperCase() + role.substring(1);
  }
}

final _caseRefPattern = RegExp(
  r'\b((?:OB|CMP|OB-|CMP-)[A-Z0-9-]+)\b',
  caseSensitive: false,
);

List<TextSpan> messageSpans(String message, {required TextStyle baseStyle}) {
  final matches = _caseRefPattern.allMatches(message).toList();
  if (matches.isEmpty) {
    return [TextSpan(text: message, style: baseStyle)];
  }

  final spans = <TextSpan>[];
  var cursor = 0;

  for (final match in matches) {
    if (match.start > cursor) {
      spans.add(
        TextSpan(
          text: message.substring(cursor, match.start),
          style: baseStyle,
        ),
      );
    }

    spans.add(
      TextSpan(
        text: match.group(0),
        style: baseStyle.copyWith(
          color: AppColors.spfBlue,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
    cursor = match.end;
  }

  if (cursor < message.length) {
    spans.add(TextSpan(text: message.substring(cursor), style: baseStyle));
  }

  return spans;
}

String compactRelativeTime(DateTime? value) {
  if (value == null) return '—';
  final local = value.toLocal();
  final now = DateTime.now();
  final diff = now.difference(local);

  if (diff.inMinutes < 1) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m';
  if (diff.inHours < 24) return '${diff.inHours}h';
  if (diff.inDays == 1) return 'Yesterday';
  if (diff.inDays < 7) return '${diff.inDays}d';
  return '${local.day}/${local.month}/${local.year}';
}
