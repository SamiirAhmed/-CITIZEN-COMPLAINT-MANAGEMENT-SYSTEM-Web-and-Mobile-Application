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
  List<DistrictOption> _districtOptions = [];
  List<String> _villages = [];
  List<String> _areas = [];
  DistrictOption? _selectedDistrictOption;
  String? _selectedVillage;
  String? _selectedArea;
  bool _loadingDistricts = true;
  bool _loadingVillages = false;
  bool _loadingAreas = false;
  String? _villageHint;
  String? _areaHint;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadDistricts());
  }

  Future<void> _onDistrictChanged(DistrictOption? option) async {
    setState(() {
      _selectedDistrictOption = option;
      _selectedVillage = null;
      _selectedArea = null;
      _villages = [];
      _areas = [];
      _villageHint = null;
      _areaHint = null;
    });
    if (option == null) return;

    setState(() => _loadingVillages = true);
    try {
      final villages = await context.read<GeographyService>().listVillages(
            option.region,
            option.district,
          );
      if (!mounted) return;
      setState(() {
        _villages = villages;
        _loadingVillages = false;
        _villageHint = villages.isEmpty
            ? 'No villages available for this district.'
            : null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingVillages = false;
        _villageHint = 'Unable to load villages.';
      });
    }
  }

  Future<void> _onVillageChanged(String? village) async {
    setState(() {
      _selectedVillage = village;
      _selectedArea = null;
      _areas = [];
      _areaHint = null;
    });
    final option = _selectedDistrictOption;
    if (village == null || option == null) return;

    setState(() => _loadingAreas = true);
    try {
      final areas = await context.read<GeographyService>().listAreas(
            option.region,
            option.district,
            village,
          );
      if (!mounted) return;
      setState(() {
        _areas = areas;
        _loadingAreas = false;
        _areaHint =
            areas.isEmpty ? 'No areas available for this village.' : null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingAreas = false;
        _areaHint = 'Unable to load areas.';
      });
    }
  }

  Future<void> _loadDistricts() async {
    final geography = context.read<GeographyService>();
    setState(() {
      _loadingDistricts = true;
      _error = null;
    });
    try {
      final districts = await geography.listAllDistricts();
      if (!mounted) return;
      setState(() {
        _districtOptions = districts;
        _loadingDistricts = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingDistricts = false;
        _error = 'Unable to load districts. Check your connection.';
      });
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
    if (_selectedDistrictOption == null) {
      setState(() => _error = 'Please select a district.');
      return;
    }

    setState(() => _error = null);

    final auth = context.read<AuthenticationService>();
    try {
      await auth.register(
        name: _name.text,
        niraId: _niraId.text,
        phone: _phone.text,
        email: _email.text.trim(),
        password: _password.text,
        confirmPassword: _confirm.text,
        profileImagePath: _profileImage!.path,
        region: _selectedDistrictOption!.region,
        district: _selectedDistrictOption!.district,
        village: _selectedVillage ?? '',
        area: _selectedArea ?? '',
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
                    labelText: 'District',
                    border: OutlineInputBorder(),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<DistrictOption>(
                      isExpanded: true,
                      value: _districtOptions.contains(_selectedDistrictOption)
                          ? _selectedDistrictOption
                          : null,
                      hint: Text(
                        _loadingDistricts
                            ? 'Loading districts…'
                            : 'Select District',
                      ),
                      items: _districtOptions
                          .map(
                            (option) => DropdownMenuItem(
                              value: option,
                              child: Text(option.label),
                            ),
                          )
                          .toList(),
                      onChanged:
                          _loadingDistricts ? null : _onDistrictChanged,
                    ),
                  ),
                ),
                if (_error == 'Unable to load districts. Check your connection.')
                  TextButton(
                    onPressed: _loadDistricts,
                    child: const Text('Retry'),
                  ),
                const SizedBox(height: 14),
                InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Village',
                    border: OutlineInputBorder(),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _villages.contains(_selectedVillage)
                          ? _selectedVillage
                          : null,
                      hint: Text(
                        _selectedDistrictOption == null
                            ? 'Select a district first'
                            : _loadingVillages
                                ? 'Loading villages…'
                                : 'Select Village',
                      ),
                      items: _villages
                          .map(
                            (item) => DropdownMenuItem(
                              value: item,
                              child: Text(item),
                            ),
                          )
                          .toList(),
                      onChanged: _selectedDistrictOption == null ||
                              _loadingVillages
                          ? null
                          : _onVillageChanged,
                    ),
                  ),
                ),
                if (_villageHint != null) ...[
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      _villageHint!,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Area',
                    border: OutlineInputBorder(),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: _areas.contains(_selectedArea)
                          ? _selectedArea
                          : null,
                      hint: Text(
                        _selectedVillage == null
                            ? 'Select a village first'
                            : _loadingAreas
                                ? 'Loading areas…'
                                : 'Select Area',
                      ),
                      items: _areas
                          .map(
                            (item) => DropdownMenuItem(
                              value: item,
                              child: Text(item),
                            ),
                          )
                          .toList(),
                      onChanged:
                          _selectedVillage == null || _loadingAreas
                              ? null
                              : (value) =>
                                  setState(() => _selectedArea = value),
                    ),
                  ),
                ),
                if (_areaHint != null) ...[
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      _areaHint!,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
                if ([
                  _selectedDistrictOption?.district,
                  _selectedVillage,
                  _selectedArea,
                ].any((item) => (item ?? '').isNotEmpty)) ...[
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      [
                        _selectedDistrictOption?.district,
                        _selectedVillage,
                        _selectedArea,
                      ].where((item) => (item ?? '').isNotEmpty).join(' — '),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.spfBlue,
                      ),
                    ),
                  ),
                ],
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
