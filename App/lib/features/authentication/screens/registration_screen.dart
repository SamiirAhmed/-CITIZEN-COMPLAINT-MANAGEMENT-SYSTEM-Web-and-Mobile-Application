import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
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
import '../../../services/geography_service.dart';

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
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _picker = ImagePicker();
  XFile? _profileImage;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _error;
  List<String> _regions = [];
  List<String> _districts = [];
  String? _selectedRegion;
  String? _selectedDistrict;
  bool _loadingRegions = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadRegions());
  }

  Future<void> _loadRegions() async {
    final geography = context.read<GeographyService>();
    try {
      final regions = await geography.listRegions();
      if (!mounted) return;
      setState(() {
        _regions = regions;
        _loadingRegions = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingRegions = false;
        _error = 'Unable to load regions. Check your connection.';
      });
    }
  }

  Future<void> _loadDistricts(String region) async {
    final geography = context.read<GeographyService>();
    try {
      final districts = await geography.listDistricts(region);
      if (!mounted) return;
      setState(() {
        _districts = districts;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Unable to load districts.');
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _niraId.dispose();
    _phone.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    setState(() => _error = null);
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 85,
    );
    if (picked == null) return;

    final bytes = await picked.length();
    if (bytes > 2 * 1024 * 1024) {
      setState(() => _error = 'Profile image must be 2MB or smaller.');
      return;
    }

    final lower = picked.name.toLowerCase();
    final okExt = lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.webp');
    if (!okExt) {
      setState(() => _error = 'Profile image must be a JPEG, PNG, or WebP file.');
      return;
    }

    setState(() => _profileImage = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_profileImage == null) {
      setState(() => _error = 'Profile image is required.');
      return;
    }
    if (_selectedRegion == null || _selectedRegion!.isEmpty) {
      setState(() => _error = 'Region is required.');
      return;
    }
    if (_selectedDistrict == null || _selectedDistrict!.isEmpty) {
      setState(() => _error = 'District is required.');
      return;
    }

    setState(() => _error = null);

    final auth = context.read<AuthenticationService>();
    try {
      await auth.register(
        name: _name.text,
        niraId: _niraId.text,
        phone: _phone.text,
        email: _email.text,
        password: _password.text,
        confirmPassword: _confirm.text,
        profileImagePath: _profileImage!.path,
        region: _selectedRegion!,
        district: _selectedDistrict!,
      );
      if (!mounted) return;

      await ConfirmationDialog.info(
        context,
        title: 'Registration successful',
        message:
            'Your citizen account has been created. Welcome to the SPF Citizen Portal.',
      );
      if (!mounted) return;

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
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    width: 112,
                    height: 112,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.surface,
                      border: Border.all(color: AppColors.border),
                      image: _profileImage != null
                          ? DecorationImage(
                              image: FileImage(File(_profileImage!.path)),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: _profileImage == null
                        ? const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_a_photo_outlined),
                              SizedBox(height: 4),
                              Text('Photo *', style: TextStyle(fontSize: 12)),
                            ],
                          )
                        : null,
                  ),
                ),
                TextButton(
                  onPressed: _pickImage,
                  child: Text(
                    _profileImage == null
                        ? 'Add profile photo (required)'
                        : 'Change profile photo',
                  ),
                ),
                const SizedBox(height: 8),
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
                  controller: _email,
                  label: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                  validator: AuthenticationValidator.email,
                ),
                const SizedBox(height: 14),
                InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Region',
                    border: OutlineInputBorder(),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _selectedRegion,
                      hint: Text(_loadingRegions ? 'Loading regions…' : 'Select region'),
                      items: _regions
                          .map(
                            (region) => DropdownMenuItem(
                              value: region,
                              child: Text(region),
                            ),
                          )
                          .toList(),
                      onChanged: _loadingRegions
                          ? null
                          : (value) {
                              setState(() {
                                _selectedRegion = value;
                                _selectedDistrict = null;
                                _districts = [];
                              });
                              if (value != null) {
                                _loadDistricts(value);
                              }
                            },
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'District',
                    border: OutlineInputBorder(),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _selectedDistrict,
                      hint: Text(
                        _selectedRegion == null
                            ? 'Select region first'
                            : 'Select district',
                      ),
                      items: _districts
                          .map(
                            (district) => DropdownMenuItem(
                              value: district,
                              child: Text(district),
                            ),
                          )
                          .toList(),
                      onChanged: _selectedRegion == null
                          ? null
                          : (value) {
                              setState(() => _selectedDistrict = value);
                            },
                    ),
                  ),
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
