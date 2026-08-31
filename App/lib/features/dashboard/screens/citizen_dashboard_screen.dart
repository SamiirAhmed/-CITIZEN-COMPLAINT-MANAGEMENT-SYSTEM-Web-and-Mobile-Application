import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/route_args.dart';
import '../../../core/widgets/error_state.dart';
import '../../../layouts/citizen_app_layout.dart';
import '../../../services/authentication_service.dart';
import '../../../services/complaint_service.dart';
import '../../../services/notification_service.dart';
import '../utils/dashboard_helpers.dart';
import '../widgets/dashboard_body.dart';
import '../widgets/dashboard_skeleton.dart';
import '../widgets/dashboard_top_bar.dart';

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

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final complaintService = context.read<ComplaintService>();
      final notificationService = context.read<NotificationService>();

      final results = await Future.wait([
        complaintService.getDashboard(),
        notificationService.getUnreadCount(),
      ]);

      if (!mounted) return;

      setState(() {
        _data = results[0] as DashboardData;
        _unreadCount = results[1] as int;
        _loading = false;
        _error = null;
      });

      CitizenAppLayout.of(context)?.refreshUnreadBadge();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        if (!silent || _data == null) _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        if (!silent || _data == null) {
          _error = 'Unable to load dashboard data.';
        }
        _loading = false;
      });
    }
  }

  void _openTab(int index) {
    CitizenAppLayout.of(context)?.selectTab(index);
  }

  Future<void> _submitComplaint() async {
    await Navigator.pushNamed(context, AppRoutes.submitComplaint);
    if (!mounted) return;
    await _load(silent: true);
  }

  void _openObDetails(String id, {String? obNumber}) {
    Navigator.pushNamed(
      context,
      AppRoutes.obDetails,
      arguments: ObRouteRef(id: id, obNumber: obNumber),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthenticationService>().user;
    final citizenName = displayFirstName(user?.name ?? 'Citizen');
    final needsProfile = user?.needsProfileCompletion == true ||
        user?.profileComplete != true;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          DashboardTopBar(
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
                  : _error != null && _data == null
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            SizedBox(
                              height: MediaQuery.of(context).size.height * 0.5,
                              child: ErrorState(
                                message: _error!,
                                onRetry: _load,
                              ),
                            ),
                          ],
                        )
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            if (needsProfile) ...[
                              Material(
                                color: const Color(0xFFFFF7ED),
                                borderRadius: BorderRadius.circular(14),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(14),
                                  onTap: () {
                                    Navigator.pushNamed(
                                      context,
                                      AppRoutes.completeProfile,
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: const Color(0xFFFDBA74),
                                      ),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(
                                          Icons.task_alt_outlined,
                                          color: AppColors.warning,
                                        ),
                                        SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            'Complete your profile to finish account setup.',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                        Icon(
                                          Icons.chevron_right,
                                          color: AppColors.textSecondary,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],
                            DashboardBody(
                              data: _data!,
                              citizenName: citizenName,
                              onOpenComplaints: () => _openTab(1),
                              onOpenObRecords: () => _openTab(2),
                              onSubmitComplaint: _submitComplaint,
                              onOpenObDetails: _openObDetails,
                              onOpenComplaintDetails: (id) {
                                Navigator.pushNamed(
                                  context,
                                  AppRoutes.complaintDetails,
                                  arguments: id,
                                );
                              },
                            ),
                          ],
                        ),
            ),
          ),
        ],
      ),
    );
  }
}
