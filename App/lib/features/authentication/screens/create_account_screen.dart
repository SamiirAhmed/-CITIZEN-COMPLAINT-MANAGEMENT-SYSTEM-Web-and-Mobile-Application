import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/validation/authentication_validator.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/text_input_field.dart';
import '../../../services/authentication_service.dart';
import '../../../services/geography_service.dart';

class CreateAccountScreen extends StatefulWidget {
  const CreateAccountScreen({super.key});

  @override
  State<CreateAccountScreen> createState() => _CreateAccountScreenState();
}

class _CreateAccountScreenState extends State<CreateAccountScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _niraId = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _submitting = false;
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

  Future<void> _loadDistricts() async {
    setState(() {
      _loadingDistricts = true;
      _error = null;
    });
    try {
      final districts =
          await context.read<GeographyService>().listAllDistricts();
      if (!mounted) return;
      setState(() {
        _districtOptions = districts;
        _loadingDistricts = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingDistricts = false;
        _error = 'Unable to load districts.';
      });
    }
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
      final villages = await context
          .read<GeographyService>()
          .listVillages(option.region, option.district);
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

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    _niraId.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDistrictOption == null) {
      setState(() => _error = 'Please select a district.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await context.read<AuthenticationService>().completeAccount(
            name: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
            confirmPassword: _confirm.text,
            region: _selectedDistrictOption!.region,
            district: _selectedDistrictOption!.district,
            village: _selectedVillage ?? '',
            area: _selectedArea ?? '',
            niraId: _niraId.text.trim(),
          );
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthenticationService>();
    final phone = auth.pendingPhone ?? auth.pendingMaskedPhone ?? '';

    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          autovalidateMode: AutovalidateMode.disabled,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Center(
                child: Image.asset(AppConstants.logoAsset, width: 64, height: 64),
              ),
              const SizedBox(height: 12),
              Text(
                'Complete your account',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF4FF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified, color: AppColors.success),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Mobile Number',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          Text(
                            phone.isEmpty ? 'Verified' : '$phone  ·  Verified ✓',
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              TextInputField(
                controller: _name,
                label: 'Full Name',
                prefixIcon: Icons.person_outline,
                validator: (v) {
                  final value = (v ?? '').trim();
                  if (value.isEmpty) return 'Full name is required.';
                  if (value.length > 30) {
                    return 'Name must be at most 30 characters.';
                  }
                  return null;
                },
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
                controller: _niraId,
                label: 'NIRA ID (optional)',
                prefixIcon: Icons.badge_outlined,
                maxLength: 11,
                validator: (v) {
                  final value = (v ?? '').trim();
                  if (value.isEmpty) return null;
                  if (value.length != 11) {
                    return 'NIRA ID must be exactly 11 characters.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 14),
              Text(
                'District',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<DistrictOption>(
                value: _selectedDistrictOption,
                decoration: InputDecoration(
                  hintText: _loadingDistricts
                      ? 'Loading districts...'
                      : 'Select District',
                  prefixIcon: const Icon(Icons.location_city_outlined),
                ),
                items: _districtOptions
                    .map(
                      (d) => DropdownMenuItem(
                        value: d,
                        child: Text(d.label),
                      ),
                    )
                    .toList(),
                onChanged: _loadingDistricts ? null : _onDistrictChanged,
                validator: (v) =>
                    v == null ? 'Please select a district.' : null,
              ),
              if (_error == 'Unable to load districts.') ...[
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _loadDistricts,
                  child: const Text('Retry'),
                ),
              ],
              const SizedBox(height: 14),
              Text(
                'Village',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _villages.contains(_selectedVillage)
                    ? _selectedVillage
                    : null,
                decoration: InputDecoration(
                  hintText: _selectedDistrictOption == null
                      ? 'Select a district first'
                      : _loadingVillages
                          ? 'Loading villages...'
                          : 'Select Village',
                ),
                items: _villages
                    .map(
                      (v) => DropdownMenuItem(value: v, child: Text(v)),
                    )
                    .toList(),
                onChanged: _selectedDistrictOption == null || _loadingVillages
                    ? null
                    : _onVillageChanged,
              ),
              if (_villageHint != null) ...[
                const SizedBox(height: 6),
                Text(
                  _villageHint!,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
              const SizedBox(height: 14),
              Text(
                'Area',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _areas.contains(_selectedArea) ? _selectedArea : null,
                decoration: InputDecoration(
                  hintText: _selectedVillage == null
                      ? 'Select a village first'
                      : _loadingAreas
                          ? 'Loading areas...'
                          : 'Select Area',
                ),
                items: _areas
                    .map(
                      (a) => DropdownMenuItem(value: a, child: Text(a)),
                    )
                    .toList(),
                onChanged: _selectedVillage == null || _loadingAreas
                    ? null
                    : (v) => setState(() => _selectedArea = v),
              ),
              if (_areaHint != null) ...[
                const SizedBox(height: 6),
                Text(
                  _areaHint!,
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
              if ([
                _selectedDistrictOption?.district,
                _selectedVillage,
                _selectedArea,
              ].any((item) => (item ?? '').isNotEmpty)) ...[
                const SizedBox(height: 10),
                Text(
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
              ],
              const SizedBox(height: 14),
              TextInputField(
                controller: _password,
                label: 'Password',
                obscureText: _obscurePassword,
                prefixIcon: Icons.lock_outline,
                onToggleObscure: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
                validator: AuthenticationValidator.password,
              ),
              const SizedBox(height: 14),
              TextInputField(
                controller: _confirm,
                label: 'Confirm Password',
                obscureText: _obscureConfirm,
                prefixIcon: Icons.lock_outline,
                onToggleObscure: () {
                  setState(() => _obscureConfirm = !_obscureConfirm);
                },
                validator: (v) =>
                    AuthenticationValidator.confirmPassword(v, _password.text),
              ),
              if (_error != null && _error != 'Unable to load districts.') ...[
                const SizedBox(height: 14),
                Text(_error!, style: const TextStyle(color: AppColors.error)),
              ],
              const SizedBox(height: 22),
              PrimaryButton(
                label: 'Create Account',
                loading: _submitting,
                onPressed: _submitting ? null : _submit,
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
