import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/validation/citizen_validator.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../core/widgets/text_input_field.dart';
import '../../../services/complaint_service.dart';

class SubmitComplaintScreen extends StatefulWidget {
  const SubmitComplaintScreen({super.key});

  @override
  State<SubmitComplaintScreen> createState() => _SubmitComplaintScreenState();
}

class _SubmitComplaintScreenState extends State<SubmitComplaintScreen> {
  final _formKey = GlobalKey<FormState>();
  final _description = TextEditingController();
  final _location = TextEditingController();
  final _related = TextEditingController();
  final _evidence = TextEditingController();
  final _incidentDateText = TextEditingController();

  List<String> _categories = [];
  String? _category;
  DateTime? _incidentDate;
  bool _loadingCategories = true;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _description.dispose();
    _location.dispose();
    _related.dispose();
    _evidence.dispose();
    _incidentDateText.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
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
        _error = 'Unable to load categories.';
        _loadingCategories = false;
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

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final complaint = await context.read<ComplaintService>().submitComplaint(
            category: _category!,
            description: _description.text,
            incidentDate: _incidentDate!,
            location: _location.text,
            relatedInformation: _related.text,
            evidenceNotes: _evidence.text,
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

      _formKey.currentState!.reset();
      _description.clear();
      _location.clear();
      _related.clear();
      _evidence.clear();
      _incidentDateText.clear();
      setState(() {
        _category = null;
        _incidentDate = null;
      });

      Navigator.pop(context, true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Unable to submit complaint.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Submit Complaint')),
      body: _loadingCategories
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
                      Text(
                        'Complaint Category',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
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
                        prefixIcon: Icons.calendar_today_outlined,
                        onTap: _submitting ? null : _pickDate,
                        validator: (_) => _incidentDate == null
                            ? 'Incident date is required'
                            : null,
                      ),
                      const SizedBox(height: 14),
                      TextInputField(
                        controller: _location,
                        label: 'Location',
                        hint: 'Where did it happen?',
                        prefixIcon: Icons.place_outlined,
                        validator: (v) => CitizenValidator.requiredField(
                          v,
                          field: 'Location',
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextInputField(
                        controller: _related,
                        label: 'Related Information',
                        hint: 'Optional additional details',
                        maxLines: 3,
                        minLines: 2,
                      ),
                      const SizedBox(height: 14),
                      TextInputField(
                        controller: _evidence,
                        label: 'Evidence / Attachments Notes',
                        hint: 'Describe evidence available (optional)',
                        maxLines: 3,
                        minLines: 2,
                      ),
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
                      PrimaryButton(
                        label: 'Submit Complaint',
                        loading: _submitting,
                        onPressed: _submitting ? null : _submit,
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
