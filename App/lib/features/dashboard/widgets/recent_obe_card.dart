import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/status_badge.dart';
import 'overview_stat_card.dart';

class RecentObCard extends StatelessWidget {
  const RecentObCard({
    super.key,
    required this.obRecord,
    required this.onTap,
  });

  final Map<String, dynamic> obRecord;
  final VoidCallback onTap;

  String get _obNumber => '${obRecord['obNumber'] ?? ''}'.trim();
  String get _status => '${obRecord['status'] ?? ''}'.trim();
  DateTime? get _updatedAt =>
      DateTime.tryParse('${obRecord['updatedAt'] ?? ''}');

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const DashboardSectionTitle(title: 'Recent OBE'),
        const SizedBox(height: 10),
        Material(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(18),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(18),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.navy.withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _obNumber,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      color: AppColors.spfBlue,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Text(
                        'Status:',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (_status.isNotEmpty) StatusBadge(status: _status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Last Updated: ${DateFormatters.dateTime(_updatedAt)}',
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        'View Details',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.spfBlue.withValues(alpha: 0.95),
                        ),
                      ),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: AppColors.spfBlue.withValues(alpha: 0.95),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
