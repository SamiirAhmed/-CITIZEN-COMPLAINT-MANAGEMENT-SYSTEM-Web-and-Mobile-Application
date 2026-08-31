import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/status_badge.dart';
import '../utils/dashboard_helpers.dart';
import 'overview_stat_card.dart';

class RecentActivitySection extends StatelessWidget {
  const RecentActivitySection({
    super.key,
    required this.items,
    required this.onTapItem,
  });

  final List<DashboardActivityItem> items;
  final ValueChanged<DashboardActivityItem> onTapItem;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const DashboardSectionTitle(title: 'Recent Updates'),
        const SizedBox(height: 12),
        if (items.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.border),
            ),
            child: const Column(
              children: [
                Icon(
                  Icons.history_rounded,
                  color: AppColors.textSecondary,
                  size: 28,
                ),
                SizedBox(height: 10),
                Text(
                  'No recent updates',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Updates about your complaints and OB records will appear here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          )
        else
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            decoration: BoxDecoration(
              color: AppColors.white,
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
              children: [
                for (var i = 0; i < items.length; i++)
                  RecentActivityTimelineItem(
                    item: items[i],
                    isLast: i == items.length - 1,
                    onTap: () => onTapItem(items[i]),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

class RecentActivityTimelineItem extends StatelessWidget {
  const RecentActivityTimelineItem({
    super.key,
    required this.item,
    required this.isLast,
    required this.onTap,
  });

  final DashboardActivityItem item;
  final bool isLast;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  margin: const EdgeInsets.only(top: 6),
                  decoration: BoxDecoration(
                    color: AppColors.spfBlue,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppColors.spfBlue.withValues(alpha: 0.2),
                      width: 3,
                    ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: AppColors.border,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 8 : 18),
              child: Material(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  onTap: onTap,
                  borderRadius: BorderRadius.circular(14),
                  child: Ink(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: AppColors.border.withValues(alpha: 0.8),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.reference.isNotEmpty
                              ? item.reference
                              : item.eventTitle,
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            color: AppColors.spfBlue,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.eventTitle,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: AppColors.navy,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          DateFormatters.dateTime(item.updatedAt),
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (item.status.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          StatusBadge(status: item.status),
                        ],
                        if (item.description.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            'Summary:',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textSecondary.withValues(alpha: 0.9),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.description,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 12.5,
                              color: AppColors.textSecondary,
                              height: 1.45,
                            ),
                          ),
                        ],
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text(
                              'View details',
                              style: TextStyle(
                                fontSize: 12.5,
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
            ),
          ),
        ],
      ),
    );
  }
}
