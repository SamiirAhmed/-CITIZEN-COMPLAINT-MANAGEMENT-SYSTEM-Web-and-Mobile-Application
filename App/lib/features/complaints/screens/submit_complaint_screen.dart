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
  final _related = TextEditingController();
  final _evidenceNotes = TextEditingController();
  final _incidentDateText = TextEditingController();
  final _picker = ImagePicker();

  List<String> _categories = [];
  List<String> _regions = [];
  List<String> _districts = [];
  List<_EvidenceFile> _evidenceFiles = [];

  String? _category;
  String? _region;
  String? _district;
  DateTime? _incidentDate;

  bool _loadingForm = true;
  bool _loadingDistricts = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFormData();
  }

  @override
  void dispose() {
    _description.dispose();
    _village.dispose();
    _area.dispose();
    _related.dispose();
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

  Future<void> _loadFormData() async {
    try {
      final complaintService = context.read<ComplaintService>();
      final geography = context.read<GeographyService>();
      final results = await Future.wait([
        complaintService.getCategories(),
        geography.listRegions(),
      ]);
      if (!mounted) return;
      final regions = results[1];
      setState(() {
        _categories = results[0];
        _regions = regions;
        _region = regions.contains('Banaadir')
            ? 'Banaadir'
            : (regions.isNotEmpty ? regions.first : null);
        _loadingForm = false;
      });
      if (_region != null) {
        await _loadDistricts(_region!);
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loadingForm = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to prepare complaint form.';
        _loadingForm = false;
      });
    }
  }

  Future<void> _loadDistricts(String region) async {
    setState(() {
      _loadingDistricts = true;
      _districts = [];
      _district = null;
    });
    try {
      final districts =
          await context.read<GeographyService>().listDistricts(region);
      if (!mounted) return;
      setState(() {
        _districts = districts;
        _loadingDistricts = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loadingDistricts = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load districts.';
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
    if (_region == null || _region!.trim().isEmpty) {
      setState(() => _error = 'Region is required.');
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
            region: _region!,
            district: _district!,
            village: _village.text,
            area: _area.text,
            location: _buildLocation(),
            relatedInformation: _related.text,
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

      Navigator.pop(context, true);
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
    return Scaffold(
      appBar: AppBar(title: const Text('Submit Complaint')),
      body: _loadingForm
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
                      _label('Region'),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        key: ValueKey('region-$_region'),
                        initialValue: _region,
                        items: _regions
                            .map(
                              (item) => DropdownMenuItem(
                                value: item,
                                child: Text(item),
                              ),
                            )
                            .toList(),
                        onChanged: _submitting
                            ? null
                            : (value) async {
                                if (value == null) return;
                                setState(() {
                                  _region = value;
                                  _village.clear();
                                  _area.clear();
                                });
                                await _loadDistricts(value);
                              },
                        decoration: const InputDecoration(
                          hintText: 'Select region',
                        ),
                        validator: (value) =>
                            value == null ? 'Region is required' : null,
                      ),
                      _hint('Select the Somali administrative region.'),
                      const SizedBox(height: 14),
                      _label('District'),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        key: ValueKey(
                          'district-$_region-${_districts.length}-$_district',
                        ),
                        initialValue: _district,
                        items: _districts
                            .map(
                              (item) => DropdownMenuItem(
                                value: item,
                                child: Text(item),
                              ),
                            )
                            .toList(),
                        onChanged: (_submitting ||
                                _loadingDistricts ||
                                _region == null)
                            ? null
                            : (value) => setState(() {
                                  _district = value;
                                  _village.clear();
                                  _area.clear();
                                }),
                        decoration: InputDecoration(
                          hintText: _loadingDistricts
                              ? 'Loading districts…'
                              : 'Select district',
                        ),
                        validator: (value) =>
                            value == null ? 'District is required' : null,
                      ),
                      _hint(
                        'Select a registered district (e.g. the 18 Banaadir districts).',
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
                      const SizedBox(height: 14),
                      TextInputField(
                        controller: _related,
                        label: 'Related Information',
                        hint: 'Optional additional details',
                        maxLines: 3,
                        minLines: 2,
                        enabled: !_submitting,
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
