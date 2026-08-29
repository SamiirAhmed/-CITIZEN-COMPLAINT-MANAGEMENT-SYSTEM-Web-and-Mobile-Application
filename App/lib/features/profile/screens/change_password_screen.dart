import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/validation/authentication_validator.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/text_input_field.dart';
import '../../../services/citizen_service.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _saving = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _currentPassword.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    try {
      await context.read<CitizenService>().changePassword(
            currentPassword: _currentPassword.text,
            newPassword: _newPassword.text,
            confirmPassword: _confirmPassword.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password changed successfully.'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Change Password')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                TextInputField(
                  controller: _currentPassword,
                  label: 'Current Password',
                  obscureText: _obscureCurrent,
                  prefixIcon: Icons.lock_outline,
                  validator: AuthenticationValidator.password,
                  onToggleObscure: () {
                    setState(() => _obscureCurrent = !_obscureCurrent);
                  },
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _newPassword,
                  label: 'New Password',
                  obscureText: _obscureNew,
                  prefixIcon: Icons.lock_outline,
                  validator: AuthenticationValidator.password,
                  onToggleObscure: () {
                    setState(() => _obscureNew = !_obscureNew);
                  },
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _confirmPassword,
                  label: 'Confirm New Password',
                  obscureText: _obscureConfirm,
                  prefixIcon: Icons.lock_outline,
                  validator: (v) => AuthenticationValidator.confirmPassword(
                    v,
                    _newPassword.text,
                  ),
                  onToggleObscure: () {
                    setState(() => _obscureConfirm = !_obscureConfirm);
                  },
                ),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Update Password',
                  loading: _saving,
                  onPressed: _save,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
