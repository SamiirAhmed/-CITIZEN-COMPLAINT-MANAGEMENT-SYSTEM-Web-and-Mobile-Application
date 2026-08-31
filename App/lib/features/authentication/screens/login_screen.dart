import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/somali_phone.dart';
import '../../../core/validation/authentication_validator.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/text_input_field.dart';
import '../../../services/authentication_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String _resolveIdentifier(String raw) {
    final trimmed = raw.trim();
    if (trimmed.contains('@')) return trimmed.toLowerCase();
    return SomaliPhone.normalize(trimmed);
  }

  String? _validateIdentifier(String? value) {
    final trimmed = (value ?? '').trim();
    if (trimmed.isEmpty) {
      return 'Email or mobile number is required.';
    }
    if (trimmed.contains('@')) {
      return AuthenticationValidator.email(trimmed, required: true);
    }
    return SomaliPhone.validationError(trimmed);
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _error = null;
      _submitting = true;
    });

    final auth = context.read<AuthenticationService>();
    final identifier = _resolveIdentifier(_identifierController.text);

    try {
      await auth.login(
        identifier: identifier,
        password: _passwordController.text,
      );
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(
        () => _error = 'Unable to sign in. Please check your connection and try again.',
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: AppColors.spfBlue,
        title: const Text('Sign In'),
      ),
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
          top: false,
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Center(
                        child: Image.asset(
                          AppConstants.logoAsset,
                          width: 88,
                          height: 88,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        AppConstants.organization,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: AppColors.spfBlue,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Citizen Complaint Portal',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(20),
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
                          children: [
                            TextInputField(
                              controller: _identifierController,
                              label: 'Email or mobile number',
                              hint: 'you@example.com or 61XXXXXXX',
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              prefixIcon: Icons.person_outline,
                              validator: _validateIdentifier,
                            ),
                            const SizedBox(height: 16),
                            TextInputField(
                              controller: _passwordController,
                              label: 'Password',
                              hint: 'Enter your password',
                              obscureText: _obscure,
                              textInputAction: TextInputAction.done,
                              prefixIcon: Icons.lock_outline,
                              validator: AuthenticationValidator.password,
                              onToggleObscure: () {
                                setState(() => _obscure = !_obscure);
                              },
                            ),
                            if (_error != null) ...[
                              const SizedBox(height: 14),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.error.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  _error!,
                                  style: const TextStyle(
                                    color: AppColors.error,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 20),
                            PrimaryButton(
                              label: 'Sign In',
                              loading: _submitting,
                              onPressed: _submitting ? null : _submit,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: _submitting
                            ? null
                            : () {
                                Navigator.pop(context);
                              },
                        child: const Text('Continue with mobile OTP'),
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
