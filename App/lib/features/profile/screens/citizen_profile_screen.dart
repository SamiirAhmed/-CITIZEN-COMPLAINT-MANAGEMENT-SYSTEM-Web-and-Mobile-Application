import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/somali_phone.dart';
import '../../../core/widgets/confirmation_dialog.dart';
import '../../../layouts/citizen_app_layout.dart';
import '../../../models/citizen_model.dart';
import '../../../services/authentication_service.dart';
import '../widgets/profile_action_tile.dart';
import '../widgets/profile_header.dart';
import '../widgets/profile_info_card.dart';
import '../widgets/profile_security_card.dart';
import '../widgets/profile_skeleton.dart';

class CitizenProfileScreen extends StatefulWidget {
  const CitizenProfileScreen({super.key});

  @override
  State<CitizenProfileScreen> createState() => _CitizenProfileScreenState();
}

class _CitizenProfileScreenState extends State<CitizenProfileScreen> {
  bool _loading = false;
  bool _refreshing = false;
  String? _error;
  int? _lastActiveTab;

  static const _profileTabIndex = 4;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final user = context.read<AuthenticationService>().user;
      if (user == null) {
        _load(showSkeleton: true);
      }
    });
  }

  String _displayName(CitizenModel? user) {
    final name = user?.name.trim() ?? '';
    if (name.isEmpty || name.toLowerCase() == 'citizen') return 'Citizen';
    return name;
  }

  String _displayValue(String? value) {
    final trimmed = (value ?? '').trim();
    return trimmed.isEmpty ? '—' : trimmed;
  }

  String _displayPhone(CitizenModel? user) {
    final phone = (user?.phone ?? '').trim();
    if (phone.isEmpty) return '—';
    try {
      if (SomaliPhone.isValid(phone)) return SomaliPhone.display(phone);
    } catch (_) {}
    return phone;
  }

  Future<void> _load({bool showSkeleton = false, bool silent = false}) async {
    if (showSkeleton) {
      setState(() {
        _loading = true;
        _error = null;
      });
    } else if (silent) {
      setState(() => _refreshing = true);
    } else {
      setState(() {
        _refreshing = true;
        _error = null;
      });
    }

    try {
      await context.read<AuthenticationService>().refreshProfile();
      if (!mounted) return;
      setState(() {
        _loading = false;
        _refreshing = false;
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _refreshing = false;
        if (context.read<AuthenticationService>().user == null) {
          _error = e.message;
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _refreshing = false;
        if (context.read<AuthenticationService>().user == null) {
          _error = 'Unable to load your profile.';
        }
      });
    }
  }

  Future<void> _logout() async {
    final confirmed = await ConfirmationDialog.confirm(
      context,
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign Out',
      destructive: true,
    );
    if (!confirmed || !mounted) return;
    await context.read<AuthenticationService>().logout();
  }

  Future<void> _openEditProfile() async {
    await Navigator.pushNamed(context, AppRoutes.editProfile);
    if (!mounted) return;
    await _load(silent: true);
  }

  Future<void> _openCompleteProfile() async {
    await Navigator.pushNamed(context, AppRoutes.completeProfile);
    if (!mounted) return;
    await _load(silent: true);
  }

  Future<void> _openChangePassword() async {
    await Navigator.pushNamed(context, AppRoutes.changePassword);
  }

  @override
  Widget build(BuildContext context) {
    final activeTab = CitizenAppLayout.of(context)?.activeTabIndex;
    if (activeTab == _profileTabIndex &&
        _lastActiveTab != _profileTabIndex &&
        !_loading &&
        !_refreshing) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _load(silent: true);
      });
    }
    _lastActiveTab = activeTab;

    final user = context.watch<AuthenticationService>().user;
    final incomplete = user?.needsProfileCompletion == true ||
        user?.profileComplete != true;
    final displayName = _displayName(user);
    final email = (user?.email ?? '').trim();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          ProfileHeader(
            displayName: displayName,
            email: email,
            refreshing: _refreshing && !_loading,
            onMenuTap: () => CitizenAppLayout.of(context)?.openDrawer(),
            onRefresh: () => _load(silent: user != null),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _load(silent: true),
              color: AppColors.spfBlue,
              child: _loading && user == null
                  ? const ProfileSkeleton()
                  : _error != null && user == null
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            SizedBox(
                              height: MediaQuery.of(context).size.height * 0.45,
                              child: _ProfileError(
                                message: _error!,
                                onRetry: () => _load(showSkeleton: true),
                              ),
                            ),
                          ],
                        )
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            if (incomplete) ...[
                              _ProfileCompletionBanner(
                                onComplete: _openCompleteProfile,
                              ),
                              const SizedBox(height: 14),
                            ],
                            ProfileInfoCard(
                              rows: [
                                ProfileInfoRowData(
                                  icon: Icons.person_outline_rounded,
                                  label: 'Full Name',
                                  value: displayName,
                                ),
                                ProfileInfoRowData(
                                  icon: Icons.phone_outlined,
                                  label: 'Mobile Number',
                                  value: _displayPhone(user),
                                  trailing: user?.phoneVerified == true &&
                                          (user?.phone ?? '').trim().isNotEmpty
                                      ? const Icon(
                                          Icons.check_circle_rounded,
                                          size: 18,
                                          color: AppColors.success,
                                        )
                                      : null,
                                ),
                                ProfileInfoRowData(
                                  icon: Icons.email_outlined,
                                  label: 'Email Address',
                                  value: _displayValue(email),
                                ),
                                ProfileInfoRowData(
                                  icon: Icons.badge_outlined,
                                  label: 'NIRA ID',
                                  value: _displayValue(user?.niraId),
                                ),
                                ProfileInfoRowData(
                                  icon: Icons.location_on_outlined,
                                  label: 'District',
                                  value: _displayValue(user?.district),
                                ),
                                ProfileInfoRowData(
                                  icon: Icons.home_outlined,
                                  label: 'Village',
                                  value: _displayValue(user?.village),
                                ),
                                ProfileInfoRowData(
                                  icon: Icons.grid_view_rounded,
                                  label: 'Area',
                                  value: _displayValue(user?.area),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            if (incomplete)
                              ProfileActionTile(
                                title: 'Complete Profile',
                                subtitle: 'Finish setting up your account',
                                icon: Icons.task_alt_outlined,
                                primary: true,
                                onTap: _openCompleteProfile,
                              )
                            else
                              ProfileActionTile(
                                title: 'Edit Profile',
                                subtitle: 'Update your personal information',
                                icon: Icons.edit_outlined,
                                primary: true,
                                onTap: _openEditProfile,
                              ),
                            if (user?.hasPassword == true) ...[
                              const SizedBox(height: 12),
                              ProfileActionTile(
                                title: 'Change Password',
                                subtitle: 'Update your account password',
                                icon: Icons.lock_outline_rounded,
                                onTap: _openChangePassword,
                              ),
                            ],
                            const SizedBox(height: 12),
                            ProfileActionTile(
                              title: 'Sign Out',
                              subtitle: 'Sign out from your account',
                              icon: Icons.logout_rounded,
                              onTap: _logout,
                            ),
                            const SizedBox(height: 16),
                            const ProfileSecurityCard(),
                          ],
                        ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileCompletionBanner extends StatelessWidget {
  const _ProfileCompletionBanner({
    required this.onComplete,
  });

  final VoidCallback onComplete;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFFFF7ED),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onComplete,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFFDBA74)),
          ),
          child: const Row(
            children: [
              Icon(Icons.task_alt_outlined, color: AppColors.warning),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Complete your profile to finish account setup.',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileError extends StatelessWidget {
  const _ProfileError({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline,
                size: 34,
                color: AppColors.error,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Unable to load your profile.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            if (message != 'Unable to load your profile.') ...[
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
