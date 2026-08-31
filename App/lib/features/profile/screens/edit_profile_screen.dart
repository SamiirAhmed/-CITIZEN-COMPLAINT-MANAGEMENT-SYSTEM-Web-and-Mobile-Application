import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/validation/citizen_validator.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/text_input_field.dart';
import '../../../services/authentication_service.dart';
import '../../../services/citizen_service.dart';
import '../../../services/geography_service.dart';

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
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthenticationService>().user;
    _name = TextEditingController(text: user?.name ?? '');
    _phone = TextEditingController(text: user?.phone ?? '');
    _tell = TextEditingController(text: user?.tell ?? '');
    _selectedVillage =
        (user?.village ?? '').isEmpty ? null : user!.village;
    _selectedArea = (user?.area ?? '').isEmpty ? null : user!.area;
    if ((user?.district ?? '').isNotEmpty) {
      _selectedDistrictOption = DistrictOption(
        district: user!.district,
        region: user.region,
      );
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadDistricts());
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _tell.dispose();
    super.dispose();
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
          if (match != null) _selectedDistrictOption = match;
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

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDistrictOption == null) {
      setState(() => _error = 'Please select a district.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      final updated = await context.read<CitizenService>().updateProfile(
            name: _name.text,
            phone: _phone.text,
            tell: _tell.text,
            region: _selectedDistrictOption!.region,
            district: _selectedDistrictOption!.district,
            village: _selectedVillage ?? '',
            area: _selectedArea ?? '',
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
      setState(() => _error = e.message);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthenticationService>().user;
    final phoneLocked = user?.phoneVerified == true;

    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              TextInputField(
                controller: _name,
                label: 'Full Name',
                prefixIcon: Icons.person_outline,
                maxLength: 30,
                validator: CitizenValidator.name,
              ),
              const SizedBox(height: 14),
              TextInputField(
                controller: _phone,
                label: 'Mobile Number',
                keyboardType: TextInputType.phone,
                prefixIcon: Icons.phone_outlined,
                enabled: !phoneLocked,
                validator: phoneLocked ? null : CitizenValidator.phone,
              ),
              if (phoneLocked) ...[
                const SizedBox(height: 6),
                const Text(
                  'Verified mobile numbers cannot be changed here.',
                  style: TextStyle(
                    fontSize: 12.5,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
              const SizedBox(height: 14),
              TextInputField(
                controller: _tell,
                label: 'Alternative Contact (optional)',
                prefixIcon: Icons.call_outlined,
              ),
              const SizedBox(height: 18),
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
                      (d) =>
                          DropdownMenuItem(value: d, child: Text(d.label)),
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
              if (_error != null && _error != 'Unable to load districts.') ...[
                const SizedBox(height: 14),
                Text(
                  _error!,
                  style: const TextStyle(
                    color: AppColors.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
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
    );
  }
}
