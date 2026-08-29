import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/widgets/confirmation_dialog.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../layouts/citizen_app_layout.dart';
import '../../../services/authentication_service.dart';
import '../../../application/application_routes.dart';

class CitizenProfileScreen extends StatelessWidget {
  const CitizenProfileScreen({super.key});

  Future<void> _logout(BuildContext context) async {
    final confirmed = await ConfirmationDialog.confirm(
      context,
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign out',
      destructive: true,
    );
    if (!confirmed || !context.mounted) return;

    await context.read<AuthenticationService>().logout();
    // AuthGate returns to login after session clear.
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthenticationService>().user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => CitizenAppLayout.of(context)?.openDrawer(),
        ),
        actions: [
          IconButton(
            onPressed: () async {
              try {
                await context.read<AuthenticationService>().refreshProfile();
              } catch (_) {}
            },
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                Image.asset(AppConstants.logoAsset, width: 72, height: 72),
                const SizedBox(height: 12),
                Text(
                  user?.name ?? '',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(user?.email ?? ''),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                _InfoRow(label: 'Name', value: user?.name ?? '—'),
                _InfoRow(label: 'NIRA ID', value: user?.niraId ?? '—'),
                _InfoRow(label: 'Phone', value: user?.phone ?? '—'),
                _InfoRow(label: 'Tell', value: user?.tell ?? '—'),
                _InfoRow(label: 'Email', value: user?.email ?? '—'),
              ],
            ),
          ),
          const SizedBox(height: 20),
          PrimaryButton(
            label: 'Edit Profile',
            icon: Icons.edit_outlined,
            onPressed: () {
              Navigator.pushNamed(context, AppRoutes.editProfile);
            },
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: 'Change Password',
            icon: Icons.lock_outline,
            outlined: true,
            onPressed: () {
              Navigator.pushNamed(context, AppRoutes.changePassword);
            },
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: 'Sign Out',
            outlined: true,
            icon: Icons.logout,
            onPressed: () => _logout(context),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
