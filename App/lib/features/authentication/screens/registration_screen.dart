import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/validation/authentication_validator.dart';
import '../../../core/validation/citizen_validator.dart';
import '../../../core/widgets/confirmation_dialog.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/text_input_field.dart';
import '../../../services/authentication_service.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _niraId = TextEditingController();
  final _phone = TextEditingController();
  final _tell = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _niraId.dispose();
    _phone.dispose();
    _tell.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _error = null);

    final auth = context.read<AuthenticationService>();
    try {
      await auth.register(
        name: _name.text,
        niraId: _niraId.text,
        phone: _phone.text,
        tell: _tell.text,
        email: _email.text,
        password: _password.text,
        confirmPassword: _confirm.text,
      );
      if (!mounted) return;

      await ConfirmationDialog.info(
        context,
        title: 'Registration successful',
        message:
            'Your citizen account has been created. Welcome to the SPF Citizen Portal.',
      );
      if (!mounted) return;

      // Return to AuthGate so it can show the authenticated layout.
      AppNavigator.returnToRoot();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthenticationService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Citizen Registration'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                Image.asset(AppConstants.logoAsset, width: 72, height: 72),
                const SizedBox(height: 12),
                Text(
                  'Create your SPF citizen account',
                  style: Theme.of(context).textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                TextInputField(
                  controller: _name,
                  label: 'Full Name',
                  prefixIcon: Icons.person_outline,
                  maxLength: 30,
                  validator: CitizenValidator.name,
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _niraId,
                  label: 'NIRA ID',
                  prefixIcon: Icons.badge_outlined,
                  maxLength: 11,
                  validator: CitizenValidator.niraId,
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _phone,
                  label: 'Phone',
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.phone_outlined,
                  validator: CitizenValidator.phone,
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _tell,
                  label: 'Tell',
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.call_outlined,
                  validator: CitizenValidator.tell,
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _email,
                  label: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                  validator: AuthenticationValidator.email,
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _password,
                  label: 'Password',
                  obscureText: _obscurePassword,
                  prefixIcon: Icons.lock_outline,
                  validator: AuthenticationValidator.password,
                  onToggleObscure: () {
                    setState(() => _obscurePassword = !_obscurePassword);
                  },
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _confirm,
                  label: 'Confirm Password',
                  obscureText: _obscureConfirm,
                  prefixIcon: Icons.lock_outline,
                  validator: (v) => AuthenticationValidator.confirmPassword(
                    v,
                    _password.text,
                  ),
                  onToggleObscure: () {
                    setState(() => _obscureConfirm = !_obscureConfirm);
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
                  label: 'Register',
                  loading: auth.isBusy,
                  onPressed: _submit,
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Already have an account? Sign in'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
