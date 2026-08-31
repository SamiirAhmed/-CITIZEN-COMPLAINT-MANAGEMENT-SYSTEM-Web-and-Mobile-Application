import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../services/authentication_service.dart';

class AccountChoiceScreen extends StatefulWidget {
  const AccountChoiceScreen({super.key});

  @override
  State<AccountChoiceScreen> createState() => _AccountChoiceScreenState();
}

class _AccountChoiceScreenState extends State<AccountChoiceScreen> {
  bool _skipping = false;
  String? _error;

  String get _phone {
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map) {
      return (args['maskedPhone'] ?? args['phone'] ?? '').toString();
    }
    return context.read<AuthenticationService>().pendingMaskedPhone ?? '';
  }

  Future<void> _skip() async {
    setState(() {
      _skipping = true;
      _error = null;
    });
    try {
      await context.read<AuthenticationService>().skipAccountSetup();
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _skipping = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFE8EEF8),
              AppColors.background,
              Color(0xFFF8FAFC),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.spfBlue.withValues(alpha: 0.06),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Image.asset(
                          AppConstants.logoAsset,
                          width: 72,
                          height: 72,
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        'Account Setup',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Your mobile number has been verified.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      if (_phone.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          _phone,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppColors.spfBlue,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Text(
                        'Create an account now, or skip and complete your profile later.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 14),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: AppColors.error),
                        ),
                      ],
                      const SizedBox(height: 24),
                      PrimaryButton(
                        label: 'Create Account',
                        icon: Icons.person_add_alt_1_outlined,
                        onPressed: _skipping
                            ? null
                            : () {
                                Navigator.pushNamed(
                                  context,
                                  AppRoutes.createAccount,
                                );
                              },
                      ),
                      const SizedBox(height: 12),
                      PrimaryButton(
                        label: 'Skip',
                        outlined: true,
                        loading: _skipping,
                        onPressed: _skipping ? null : _skip,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
