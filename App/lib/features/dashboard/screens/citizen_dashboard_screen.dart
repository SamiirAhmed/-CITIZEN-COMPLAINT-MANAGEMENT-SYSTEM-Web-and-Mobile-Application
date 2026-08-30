import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/widgets/error_state.dart';
import '../../../layouts/citizen_app_layout.dart';
import '../../../services/authentication_service.dart';
import '../../../services/complaint_service.dart';
import '../../../services/notification_service.dart';
import '../widgets/dashboard_header.dart';
import '../widgets/dashboard_skeleton.dart';
import '../widgets/latest_status_card.dart';
import '../widgets/quick_action_card.dart';
import '../widgets/safety_info_card.dart';
import '../widgets/statistics_card.dart';
import '../widgets/welcome_card.dart';

class CitizenDashboardScreen extends StatefulWidget {
  const CitizenDashboardScreen({super.key});

  @override
  State<CitizenDashboardScreen> createState() => _CitizenDashboardScreenState();
}

class _CitizenDashboardScreenState extends State<CitizenDashboardScreen> {
  DashboardData? _data;
  bool _loading = true;
  String? _error;
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final complaintService = context.read<ComplaintService>();
      final notificationService = context.read<NotificationService>();

      final results = await Future.wait([
        complaintService.getDashboard(),
        notificationService.getNotifications(),
      ]);

      if (!mounted) return;

      final notifications = results[1] as NotificationListResult;

      setState(() {
        _data = results[0] as DashboardData;
        _unreadCount = notifications.unreadCount;
        _loading = false;
      });

      CitizenAppLayout.of(context)?.refreshUnreadBadge();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load dashboard data.';
        _loading = false;
      });
    }
  }

  void _openTab(int index) {
    CitizenAppLayout.of(context)?.selectTab(index);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthenticationService>().user;
    final citizenName = user?.name ?? 'Citizen';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          DashboardHeader(
            unreadCount: _unreadCount,
            onMenuTap: () => CitizenAppLayout.of(context)?.openDrawer(),
            onNotificationsTap: () => _openTab(3),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              color: AppColors.spfBlue,
              child: _loading
                  ? const DashboardSkeleton()
                  : _error != null
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            SizedBox(
                              height: MediaQuery.of(context).size.height * 0.55,
                              child: ErrorState(
                                message: _error!,
                                onRetry: _load,
                              ),
                            ),
                          ],
                        )
                      : _DashboardContent(
                          data: _data!,
                          citizenName: citizenName,
                          onOpenComplaints: () => _openTab(1),
                          onOpenObRecords: () => _openTab(2),
                          onSubmitComplaint: () async {
                            await Navigator.pushNamed(
                              context,
                              AppRoutes.submitComplaint,
                            );
                            _load();
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({
    required this.data,
    required this.citizenName,
    required this.onOpenComplaints,
    required this.onOpenObRecords,
    required this.onSubmitComplaint,
  });

  final DashboardData data;
  final String citizenName;
  final VoidCallback onOpenComplaints;
  final VoidCallback onOpenObRecords;
  final Future<void> Function() onSubmitComplaint;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        WelcomeCard(citizenName: citizenName),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: StatisticsCard(
                label: 'My Complaints',
                value: '${data.totalComplaints}',
                icon: Icons.description_outlined,
                accentColor: AppColors.spfBlue,
                actionLabel: data.totalComplaints > 0 ? 'View all' : null,
                onTap: data.totalComplaints > 0 ? onOpenComplaints : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StatisticsCard(
                label: 'Active',
                value: '${data.activeComplaints}',
                icon: Icons.person_outline_rounded,
                accentColor: AppColors.success,
                actionLabel: data.activeComplaints > 0 ? 'View details' : null,
                onTap: data.activeComplaints > 0 ? onOpenComplaints : null,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: StatisticsCard(
                label: 'Active OB Records',
                value: '${data.activeOBs}',
                icon: Icons.work_outline_rounded,
                accentColor: AppColors.warning,
                actionLabel: data.activeOBs > 0 ? 'View all' : null,
                onTap: data.activeOBs > 0 ? onOpenObRecords : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StatisticsCard(
                label: 'Closed Cases',
                value: '${data.closedComplaints}',
                icon: Icons.verified_user_outlined,
                accentColor: const Color(0xFF7C3AED),
                actionLabel: data.closedComplaints > 0 ? 'View all' : null,
                onTap: data.closedComplaints > 0 ? onOpenComplaints : null,
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),
        LatestStatusSectionHeader(
          onViewAll: data.latestStatus != null ? onOpenComplaints : null,
        ),
        const SizedBox(height: 10),
        LatestStatusCard(data: data),
        const SizedBox(height: 22),
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: QuickActionCard(
                title: 'Submit Complaint',
                subtitle: 'Report an issue',
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
                icon: Icons.list_alt_rounded,
                accentColor: AppColors.success,
                onTap: onOpenComplaints,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        QuickActionCard(
          title: 'View OB Records',
          subtitle: 'View your OB records and details',
          icon: Icons.folder_open_rounded,
          accentColor: AppColors.warning,
          onTap: onOpenObRecords,
          fullWidth: true,
        ),
        const SizedBox(height: 22),
        const SafetyInfoCard(),
      ],
    );
  }
}
