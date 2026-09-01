import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/validation/authentication_validator.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/text_input_field.dart';
import '../../../services/authentication_service.dart';
import '../../../services/geography_service.dart';

class CompleteProfileScreen extends StatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
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
  bool _needsPassword = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthenticationService>().user;
      if (user != null) {
        _name.text = user.name.toLowerCase() == 'citizen' ? '' : user.name;
        _email.text =
            user.email.endsWith('@otp.local') ? '' : user.email;
        _niraId.text = user.niraId;
        _needsPassword = !user.hasPassword;
        _selectedVillage = user.village.isEmpty ? null : user.village;
        _selectedArea = user.area.isEmpty ? null : user.area;
        if (user.district.isNotEmpty) {
          _selectedDistrictOption = DistrictOption(
            district: user.district,
            region: user.region,
          );
        }
      }
      _loadDistricts();
    });
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
        if (_selectedDistrictOption != null) {
          DistrictOption? match;
          for (final item in districts) {
            if (item.district == _selectedDistrictOption!.district) {
              if (_selectedDistrictOption!.region.isEmpty ||
                  item.region == _selectedDistrictOption!.region) {
                match = item;
                break;
              }
              match ??= item;
            }
          }
          if (match != null) {
            _selectedDistrictOption = match;
          }
        }
      });
      if (_selectedDistrictOption != null) {
        await _loadVillages(_selectedDistrictOption!, keepSelection: true);
      }
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
    if (option != null) await _loadVillages(option);
  }

  Future<void> _loadVillages(
    DistrictOption option, {
    bool keepSelection = false,
  }) async {
    setState(() {
      _loadingVillages = true;
      _villageHint = null;
    });
    try {
      final villages = await context
          .read<GeographyService>()
          .listVillages(option.region, option.district);
      if (!mounted) return;
      setState(() {
        _villages = villages;
        _loadingVillages = false;
        if (!keepSelection) {
          _selectedVillage = null;
          _selectedArea = null;
          _areas = [];
        } else if (_selectedVillage != null &&
            !villages.contains(_selectedVillage)) {
          _selectedVillage = null;
          _selectedArea = null;
          _areas = [];
        }
        _villageHint = villages.isEmpty
            ? 'No villages available for this district.'
            : null;
      });
      if (keepSelection && _selectedVillage != null) {
        await _loadAreas(_selectedVillage!);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingVillages = false;
        _villageHint = 'Unable to load villages.';
      });
    }
  }

  Future<void> _loadAreas(String village) async {
    final option = _selectedDistrictOption;
    if (option == null) return;
    setState(() {
      _loadingAreas = true;
      _areaHint = null;
      _selectedArea = _areas.contains(_selectedArea) ? _selectedArea : null;
    });
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
        if (_selectedArea != null && !areas.contains(_selectedArea)) {
          _selectedArea = null;
        }
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
      await context.read<AuthenticationService>().completeProfile(
            name: _name.text.trim(),
            email: _email.text.trim(),
            region: _selectedDistrictOption!.region,
            district: _selectedDistrictOption!.district,
            village: _selectedVillage ?? '',
            area: _selectedArea ?? '',
            niraId: _niraId.text.trim(),
            password: _needsPassword ? _password.text : null,
            confirmPassword: _needsPassword ? _confirm.text : null,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile completed successfully.')),
      );
      Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthenticationService>().user;

    return Scaffold(
      appBar: AppBar(title: const Text('Complete Profile')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          autovalidateMode: AutovalidateMode.disabled,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
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
                      child: Text(
                        'Mobile Number\n${user?.phone ?? '—'}  ·  Verified ✓',
                        style: const TextStyle(height: 1.35),
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
                value: _districtOptions.contains(_selectedDistrictOption)
                    ? _selectedDistrictOption
                    : null,
                decoration: InputDecoration(
                  hintText: _loadingDistricts
                      ? 'Loading districts...'
                      : 'Select District',
                ),
                items: _districtOptions
                    .map(
                      (d) => DropdownMenuItem(value: d, child: Text(d.label)),
                    )
                    .toList(),
                onChanged: _loadingDistricts ? null : _onDistrictChanged,
                validator: (v) =>
                    v == null ? 'Please select a district.' : null,
              ),
              if (_error == 'Unable to load districts.') ...[
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
                    .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                    .toList(),
                onChanged: _selectedDistrictOption == null || _loadingVillages
                    ? null
                    : (v) async {
                        setState(() {
                          _selectedVillage = v;
                          _selectedArea = null;
                          _areas = [];
                        });
                        if (v != null) await _loadAreas(v);
                      },
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
                    .map((a) => DropdownMenuItem(value: a, child: Text(a)))
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
              if (_needsPassword) ...[
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
                  validator: (v) => AuthenticationValidator.confirmPassword(
                    v,
                    _password.text,
                  ),
                ),
              ],
              if (_error != null && _error != 'Unable to load districts.') ...[
                const SizedBox(height: 14),
                Text(_error!, style: const TextStyle(color: AppColors.error)),
              ],
              const SizedBox(height: 22),
              PrimaryButton(
                label: 'Save Profile',
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
