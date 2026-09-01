import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/status_badge.dart';
import '../../../services/complaint_service.dart';

class LatestStatusCard extends StatelessWidget {
  const LatestStatusCard({
    super.key,
    required this.data,
    this.onOpenDetails,
  });

  final DashboardData data;
  final VoidCallback? onOpenDetails;

  String? _resolveMessage() {
    final status = data.latestStatus;
    if (status == null) return null;

    final reference = '${status['reference']}';
    for (final item in data.recentUpdates) {
      if ('${item['title']}' == reference) {
        final note = '${item['note'] ?? ''}'.trim();
        if (note.isNotEmpty) return note;
      }
    }

    final label = '${status['label'] ?? ''}';
    if (label.toLowerCase() == 'submitted') {
      return 'Your complaint has been submitted successfully.';
    }
    if (label.isNotEmpty) {
      return 'Current status: $label.';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final status = data.latestStatus;

    if (status == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.timeline_rounded, color: AppColors.spfBlue.withValues(alpha: 0.8)),
                const SizedBox(width: 8),
                const Text(
                  'No status yet',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'No complaints yet. Submit a complaint to track its progress here.',
              style: TextStyle(color: AppColors.textSecondary, height: 1.45),
            ),
          ],
        ),
      );
    }

    final message = _resolveMessage();
    final updatedAt = DateTime.tryParse('${status['updatedAt']}');
    final canOpen = onOpenDetails != null && '${status['id'] ?? ''}'.isNotEmpty;

    final card = Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.spfBlue.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: AppColors.spfBlue,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.spfBlue.withValues(alpha: 0.2),
                    width: 3,
                  ),
                ),
              ),
              Container(
                width: 2,
                height: 56,
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppColors.spfBlue.withValues(alpha: 0.35),
                      AppColors.spfBlue.withValues(alpha: 0.05),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        '${status['reference']}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          color: AppColors.navy,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    StatusBadge(status: '${status['label']}'),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  DateFormatters.dateTime(updatedAt),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (message != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    'Status: $message',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.navy,
                      height: 1.45,
                    ),
                  ),
                ],
                if (canOpen) ...[
                  const SizedBox(height: 10),
                  Text(
                    'Tap to view details',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.spfBlue.withValues(alpha: 0.9),
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (canOpen)
            Icon(
              Icons.chevron_right_rounded,
              color: AppColors.textSecondary.withValues(alpha: 0.8),
            ),
        ],
      ),
    );

    if (!canOpen) return card;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onOpenDetails,
        child: card,
      ),
    );
  }
}

class LatestStatusSectionHeader extends StatelessWidget {
  const LatestStatusSectionHeader({super.key, this.onViewAll});

  final VoidCallback? onViewAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(Icons.monitor_heart_outlined, size: 20, color: AppColors.spfBlue),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            'Latest Status',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
        ),
        if (onViewAll != null)
          TextButton(
            onPressed: onViewAll,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.spfBlue,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text(
              'View all',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
          ),
      ],
    );
  }
}
