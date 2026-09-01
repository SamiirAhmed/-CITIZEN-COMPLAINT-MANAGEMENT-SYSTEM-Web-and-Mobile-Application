import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/validation/citizen_validator.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/text_input_field.dart';
import '../../../services/complaint_service.dart';
import '../../../services/geography_service.dart';

class SubmitComplaintScreen extends StatefulWidget {
  const SubmitComplaintScreen({super.key});

  @override
  State<SubmitComplaintScreen> createState() => _SubmitComplaintScreenState();
}

class _EvidenceFile {
  const _EvidenceFile({
    required this.path,
    required this.name,
    required this.bytes,
    required this.isImage,
    required this.isVideo,
  });

  final String path;
  final String name;
  final int bytes;
  final bool isImage;
  final bool isVideo;
}

class _SubmitComplaintScreenState extends State<SubmitComplaintScreen> {
  static const int _maxEvidenceFiles = 5;
  static const int _maxEvidenceBytes = 25 * 1024 * 1024;
  static const Set<String> _imageExts = {'jpg', 'jpeg', 'png', 'webp'};
  static const Set<String> _videoExts = {'mp4', 'webm', 'mov'};

  final _formKey = GlobalKey<FormState>();
  final _description = TextEditingController();
  final _village = TextEditingController();
  final _area = TextEditingController();
  final _evidenceNotes = TextEditingController();
  final _incidentDateText = TextEditingController();
  final _picker = ImagePicker();

  List<String> _categories = [];
  List<String> _districts = [];
  List<_EvidenceFile> _evidenceFiles = [];

  static const String _region = 'Banaadir';

  String? _category;
  String? _district;
  DateTime? _incidentDate;

  bool _loadingCategories = true;
  bool _loadingDistricts = true;
  bool _submitting = false;
  String? _error;
  String? _districtError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCategories();
      _loadDistricts();
    });
  }

  @override
  void dispose() {
    _description.dispose();
    _village.dispose();
    _area.dispose();
    _evidenceNotes.dispose();
    _incidentDateText.dispose();
    super.dispose();
  }

  String _buildLocation() {
    return [
      _district?.trim() ?? '',
      _village.text.trim(),
      _area.text.trim(),
    ].where((part) => part.isNotEmpty).join(', ');
  }

  Future<void> _loadCategories() async {
    setState(() {
      _loadingCategories = true;
    });
    try {
      final categories =
          await context.read<ComplaintService>().getCategories();
      if (!mounted) return;
      setState(() {
        _categories = categories;
        _loadingCategories = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loadingCategories = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load complaint categories.';
        _loadingCategories = false;
      });
    }
  }

  Future<void> _loadDistricts() async {
    setState(() {
      _loadingDistricts = true;
      _districtError = null;
    });
    try {
      final districts =
          await context.read<GeographyService>().listBanaadirDistricts();
      if (!mounted) return;
      setState(() {
        _districts = districts;
        _loadingDistricts = false;
        if (_district != null && !_districts.contains(_district)) {
          _district = null;
        }
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _districtError = e.message;
        _loadingDistricts = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _districtError = 'Unable to load districts. Check your connection.';
        _loadingDistricts = false;
      });
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _incidentDate ?? now,
      firstDate: DateTime(now.year - 5),
      lastDate: now,
    );
    if (picked != null) {
      setState(() {
        _incidentDate = picked;
        _incidentDateText.text = DateFormatters.date(picked);
      });
    }
  }

  String _extensionOf(String path) {
    final parts = path.split('.');
    if (parts.length < 2) return '';
    return parts.last.toLowerCase();
  }

  String? _validateEvidenceCandidate(String path, int bytes, String name) {
    final ext = _extensionOf(path.isNotEmpty ? path : name);
    final allowed = {..._imageExts, ..._videoExts};
    if (!allowed.contains(ext)) {
      return 'Evidence must be an image (JPEG, PNG, WebP) or video (MP4, WebM, MOV).';
    }
    if (bytes > _maxEvidenceBytes) {
      return '$name must be 25MB or smaller.';
    }
    return null;
  }

  Future<void> _addEvidenceFromXFiles(List<XFile> picked) async {
    if (picked.isEmpty) return;
    final next = List<_EvidenceFile>.from(_evidenceFiles);
    for (final file in picked) {
      if (next.length >= _maxEvidenceFiles) {
        setState(() {
          _error = 'You can upload at most $_maxEvidenceFiles evidence files.';
        });
        break;
      }
      final bytes = await file.length();
      final name = file.name.isNotEmpty
          ? file.name
          : file.path.split(Platform.pathSeparator).last;
      final validation = _validateEvidenceCandidate(file.path, bytes, name);
      if (validation != null) {
        setState(() => _error = validation);
        continue;
      }
      final ext = _extensionOf(file.path.isNotEmpty ? file.path : name);
      next.add(
        _EvidenceFile(
          path: file.path,
          name: name,
          bytes: bytes,
          isImage: _imageExts.contains(ext),
          isVideo: _videoExts.contains(ext),
        ),
      );
    }
    setState(() {
      _evidenceFiles = next;
      if (_error != null &&
          _error!.startsWith('You can upload') == false &&
          _error!.contains('25MB') == false &&
          _error!.contains('Evidence must') == false) {
        // keep unrelated form errors
      }
    });
  }

  Future<void> _pickEvidence() async {
    if (_submitting || _evidenceFiles.length >= _maxEvidenceFiles) return;

    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Photos'),
              subtitle: const Text('JPEG, PNG, WebP'),
              onTap: () => Navigator.pop(context, 'images'),
            ),
            ListTile(
              leading: const Icon(Icons.videocam_outlined),
              title: const Text('Video'),
              subtitle: const Text('MP4, WebM, MOV'),
              onTap: () => Navigator.pop(context, 'video'),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Take photo'),
              onTap: () => Navigator.pop(context, 'camera'),
            ),
          ],
        ),
      ),
    );

    if (choice == null || !mounted) return;

    try {
      if (choice == 'images') {
        final remaining = _maxEvidenceFiles - _evidenceFiles.length;
        final files = await _picker.pickMultiImage(limit: remaining);
        await _addEvidenceFromXFiles(files);
      } else if (choice == 'video') {
        final file = await _picker.pickVideo(source: ImageSource.gallery);
        if (file != null) await _addEvidenceFromXFiles([file]);
      } else if (choice == 'camera') {
        final file = await _picker.pickImage(source: ImageSource.camera);
        if (file != null) await _addEvidenceFromXFiles([file]);
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Unable to pick evidence file.');
    }
  }

  void _removeEvidence(int index) {
    setState(() {
      _evidenceFiles = List<_EvidenceFile>.from(_evidenceFiles)..removeAt(index);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_category == null) {
      setState(() => _error = 'Please select a complaint category.');
      return;
    }
    if (_incidentDate == null) {
      setState(() => _error = 'Please select the incident date.');
      return;
    }
    if (_district == null || _district!.trim().isEmpty) {
      setState(() => _error = 'District is required.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final complaint = await context.read<ComplaintService>().submitComplaint(
            category: _category!,
            description: _description.text,
            incidentDate: _incidentDate!,
            region: _region,
            district: _district!,
            village: _village.text,
            area: _area.text,
            location: _buildLocation(),
            evidenceNotes: _evidenceNotes.text,
            evidenceFilePaths: _evidenceFiles.map((f) => f.path).toList(),
          );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Complaint ${complaint.complaintNumber} submitted successfully.',
          ),
          backgroundColor: AppColors.success,
        ),
      );

      Navigator.pop(context, complaint);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Unable to submit complaint.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _label(String text) {
    return Text(
      text,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
    );
  }

  Widget _hint(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Text(
        text,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
            ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final formReady = !_loadingCategories || _categories.isNotEmpty;

    return Scaffold(
      appBar: AppBar(title: const Text('Submit Complaint')),
      body: !formReady && _loadingCategories
          ? const LoadingIndicator(message: 'Preparing form...')
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Report an incident to the Somali Police Force',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 18),
                      _label('Category'),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        key: ValueKey('category-$_category'),
                        initialValue: _category,
                        items: _categories
                            .map(
                              (item) => DropdownMenuItem(
                                value: item,
                                child: Text(item),
                              ),
                            )
                            .toList(),
                        onChanged: _submitting
                            ? null
                            : (value) => setState(() => _category = value),
                        decoration: const InputDecoration(
                          hintText: 'Select category',
                        ),
                        validator: (value) =>
                            value == null ? 'Category is required' : null,
                      ),
                      const SizedBox(height: 14),
                      TextInputField(
                        controller: _description,
                        label: 'Description',
                        hint: 'Describe what happened',
                        maxLines: 5,
                        minLines: 4,
                        enabled: !_submitting,
                        validator: (v) => CitizenValidator.requiredField(
                          v,
                          field: 'Description',
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextInputField(
                        controller: _incidentDateText,
                        label: 'Incident Date',
                        hint: 'Select date',
                        readOnly: true,
                        enabled: !_submitting,
                        prefixIcon: Icons.calendar_today_outlined,
                        onTap: _submitting ? null : _pickDate,
                        validator: (_) => _incidentDate == null
                            ? 'Incident date is required'
                            : null,
                      ),
                      const SizedBox(height: 14),
                      _label('District'),
                      const SizedBox(height: 8),
                      InputDecorator(
                        decoration: InputDecoration(
                          hintText: _loadingDistricts
                              ? 'Loading districts…'
                              : 'Select district',
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            isExpanded: true,
                            value: _districts.contains(_district)
                                ? _district
                                : null,
                            hint: Text(
                              _loadingDistricts
                                  ? 'Loading districts…'
                                  : 'Select district',
                            ),
                            items: _districts
                                .map(
                                  (item) => DropdownMenuItem(
                                    value: item,
                                    child: Text(item),
                                  ),
                                )
                                .toList(),
                            onChanged: _submitting || _loadingDistricts
                                ? null
                                : (value) => setState(() {
                                      _district = value;
                                      _districtError = null;
                                      _village.clear();
                                      _area.clear();
                                    }),
                          ),
                        ),
                      ),
                      if (_districtError != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          _districtError!,
                          style: const TextStyle(
                            color: AppColors.error,
                            fontSize: 12.5,
                          ),
                        ),
                        TextButton(
                          onPressed: _loadDistricts,
                          child: const Text('Retry loading districts'),
                        ),
                      ],
                      _hint(
                        'Select a Banaadir district (e.g. Kahda, Garasbaley, Dharkenley).',
                      ),
                      const SizedBox(height: 14),
                      TextInputField(
                        controller: _village,
                        label: 'Village (optional)',
                        hint: 'Type village name manually',
                        enabled: !_submitting,
                      ),
                      _hint('Optional — enter the village near the selected district.'),
                      const SizedBox(height: 14),
                      TextInputField(
                        controller: _area,
                        label: 'Area (optional)',
                        hint: 'Type area or neighborhood manually',
                        enabled: !_submitting,
                      ),
                      _hint(
                        'Optional — enter the area or neighborhood within the village.',
                      ),
                      const SizedBox(height: 24),
                      const Divider(height: 1),
                      const SizedBox(height: 20),
                      Text(
                        'Evidence',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textSecondary,
                            ),
                      ),
                      const SizedBox(height: 14),
                      TextInputField(
                        controller: _evidenceNotes,
                        label: 'Evidence Notes',
                        hint: 'Optional notes about the attached evidence',
                        maxLines: 3,
                        minLines: 2,
                        enabled: !_submitting,
                      ),
                      const SizedBox(height: 14),
                      _label('Evidence (images / video) (optional)'),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: (_submitting ||
                                _evidenceFiles.length >= _maxEvidenceFiles)
                            ? null
                            : _pickEvidence,
                        icon: const Icon(Icons.attach_file),
                        label: Text(
                          _evidenceFiles.isEmpty
                              ? 'Choose files (optional)'
                              : 'Add more files (${_evidenceFiles.length}/$_maxEvidenceFiles)',
                        ),
                      ),
                      _hint(
                        'Optional — upload images (JPEG, PNG, WebP) or video (MP4, WebM, MOV). Max $_maxEvidenceFiles files · 25MB each.',
                      ),
                      if (_evidenceFiles.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        ...List.generate(_evidenceFiles.length, (index) {
                          final file = _evidenceFiles[index];
                          final sizeMb =
                              (file.bytes / (1024 * 1024)).toStringAsFixed(1);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: Icon(
                                file.isVideo
                                    ? Icons.videocam_outlined
                                    : Icons.image_outlined,
                              ),
                              title: Text(
                                file.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              subtitle: Text('$sizeMb MB'),
                              trailing: IconButton(
                                icon: const Icon(Icons.close),
                                onPressed: _submitting
                                    ? null
                                    : () => _removeEvidence(index),
                              ),
                            ),
                          );
                        }),
                      ],
                      if (_error != null) ...[
                        const SizedBox(height: 14),
                        Container(
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
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed:
                                  _submitting ? null : () => Navigator.pop(context),
                              child: const Text('Cancel'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: PrimaryButton(
                              label: 'Submit Complaint',
                              loading: _submitting,
                              onPressed: _submitting ? null : _submit,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
