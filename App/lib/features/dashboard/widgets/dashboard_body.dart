import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../../../services/complaint_service.dart';
import '../utils/dashboard_helpers.dart';
import 'dashboard_welcome_card.dart';
import 'overview_stat_card.dart';
import 'quick_action_card.dart';
import 'recent_activity_section.dart';
import 'recent_obe_card.dart';
import 'safety_info_card.dart';

class DashboardBody extends StatelessWidget {
  const DashboardBody({
    super.key,
    required this.data,
    required this.citizenName,
    required this.onOpenComplaints,
    required this.onOpenObRecords,
    required this.onSubmitComplaint,
    required this.onOpenObDetails,
    required this.onOpenComplaintDetails,
  });

  final DashboardData data;
  final String citizenName;
  final VoidCallback onOpenComplaints;
  final VoidCallback onOpenObRecords;
  final Future<void> Function() onSubmitComplaint;
  final void Function(String id, {String? obNumber}) onOpenObDetails;
  final void Function(String id) onOpenComplaintDetails;

  @override
  Widget build(BuildContext context) {
    final activities = buildRecentActivity(data.recentUpdates, limit: 3);
    final recentOb = data.recentOB;

    return LayoutBuilder(
      builder: (context, constraints) {
        final wideActions = constraints.maxWidth >= 360;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DashboardWelcomeCard(citizenName: citizenName),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: OverviewStatCard(
                    label: 'My Complaints',
                    value: '${data.totalComplaints}',
                    icon: Icons.description_outlined,
                    surfaceColor: const Color(0xFFE6F3FB),
                    iconColor: const Color(0xFF0369A1),
                    actionLabel: 'View all',
                    onTap: onOpenComplaints,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OverviewStatCard(
                    label: 'OB Records',
                    value: '${data.totalOBRecords}',
                    icon: Icons.folder_copy_outlined,
                    surfaceColor: const Color(0xFFEEF2F7),
                    iconColor: const Color(0xFF475569),
                    actionLabel: 'View details',
                    onTap: onOpenObRecords,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OverviewStatCard(
                    label: 'Active Cases',
                    value: '${data.activeCases}',
                    icon: Icons.work_outline_rounded,
                    surfaceColor: const Color(0xFFF5EDE4),
                    iconColor: const Color(0xFFB45309),
                    onTap: onOpenObRecords,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OverviewStatCard(
                    label: 'Closed Cases',
                    value: '${data.closedCases}',
                    icon: Icons.shield_outlined,
                    surfaceColor: const Color(0xFFEDE9F5),
                    iconColor: const Color(0xFF6D28D9),
                    onTap: onOpenObRecords,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),
            RecentActivitySection(
              items: activities,
              onTapItem: (item) {
                if (item.type == 'ob') {
                  onOpenObDetails(
                    item.id,
                    obNumber: item.reference,
                  );
                } else {
                  onOpenComplaintDetails(item.id);
                }
              },
            ),
            if (recentOb != null && recentOb.isNotEmpty) ...[
              const SizedBox(height: 22),
              RecentObCard(
                obRecord: recentOb,
                onTap: () {
                  final id = '${recentOb['id'] ?? recentOb['_id'] ?? ''}'.trim();
                  onOpenObDetails(
                    id,
                    obNumber: '${recentOb['obNumber'] ?? ''}'.trim(),
                  );
                },
              ),
            ],
            const SizedBox(height: 22),
            const DashboardSectionTitle(title: 'Quick Actions'),
            const SizedBox(height: 12),
            if (wideActions)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: QuickActionCard(
                      title: 'Submit Complaint',
                      subtitle: 'Report a new issue to the police',
                      icon: Icons.add_rounded,
                      accentColor: AppColors.spfBlue,
                      onTap: onSubmitComplaint,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: QuickActionCard(
                      title: 'View Complaints',
                      subtitle: 'Track your complaints',
                      icon: Icons.description_outlined,
                      accentColor: const Color(0xFF0369A1),
                      onTap: onOpenComplaints,
                    ),
                  ),
                ],
              )
            else ...[
              QuickActionCard(
                title: 'Submit Complaint',
                subtitle: 'Report a new issue to the police',
                icon: Icons.add_rounded,
                accentColor: AppColors.spfBlue,
                onTap: onSubmitComplaint,
                fullWidth: true,
              ),
              const SizedBox(height: 12),
              QuickActionCard(
                title: 'View Complaints',
                subtitle: 'Track your complaints',
                icon: Icons.description_outlined,
                accentColor: const Color(0xFF0369A1),
                onTap: onOpenComplaints,
                fullWidth: true,
              ),
            ],
            const SizedBox(height: 12),
            QuickActionCard(
              title: 'View OB Records',
              subtitle: 'View your OB records',
              icon: Icons.folder_copy_outlined,
              accentColor: const Color(0xFF0F766E),
              onTap: onOpenObRecords,
              fullWidth: true,
            ),
            const SizedBox(height: 22),
            const SafetyInfoCard(),
          ],
        );
      },
    );
  }
}