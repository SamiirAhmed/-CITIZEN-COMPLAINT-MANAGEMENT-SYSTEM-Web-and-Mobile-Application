import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/validation/citizen_validator.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/text_input_field.dart';
import '../../../services/authentication_service.dart';
import '../../../services/citizen_service.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _tell;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthenticationService>().user;
    _name = TextEditingController(text: user?.name ?? '');
    _phone = TextEditingController(text: user?.phone ?? '');
    _tell = TextEditingController(text: user?.tell ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _tell.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    try {
      final updated = await context.read<CitizenService>().updateProfile(
            name: _name.text,
            phone: _phone.text,
            tell: _tell.text,
          );
      if (!mounted) return;
      await context.read<AuthenticationService>().updateLocalUser(updated);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully.'),
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
      appBar: AppBar(title: const Text('Edit Profile')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                TextInputField(
                  controller: _name,
                  label: 'Name',
                  prefixIcon: Icons.person_outline,
                  maxLength: 30,
                  keyboardType: TextInputType.name,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z\s]')),
                  ],
                  validator: CitizenValidator.name,
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _phone,
                  label: 'Phone',
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.phone_outlined,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[\d+\s-]')),
                  ],
                  validator: CitizenValidator.phone,
                ),
                const SizedBox(height: 14),
                TextInputField(
                  controller: _tell,
                  label: 'Tell',
                  keyboardType: TextInputType.phone,
                  prefixIcon: Icons.call_outlined,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[\d+\s-]')),
                  ],
                  validator: CitizenValidator.tell,
                ),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Save Changes',
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
