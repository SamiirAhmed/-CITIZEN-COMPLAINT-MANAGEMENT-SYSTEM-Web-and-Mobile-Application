import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/route_args.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/error_state.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/status_badge.dart';
import '../../../models/complaint_model.dart';
import '../../../services/complaint_service.dart';

class ComplaintDetailsScreen extends StatefulWidget {
  const ComplaintDetailsScreen({super.key});

  @override
  State<ComplaintDetailsScreen> createState() => _ComplaintDetailsScreenState();
}

class _ComplaintDetailsScreenState extends State<ComplaintDetailsScreen> {
  ComplaintModel? _complaint;
  bool _loading = true;
  String? _error;
  String? _id;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final nextId = parseRouteRecordId(ModalRoute.of(context)?.settings.arguments);
    if (nextId == null) {
      if (_id == null && _loading) {
        setState(() {
          _loading = false;
          _error = 'Complaint not found. Open it from My Complaints.';
        });
      }
      return;
    }
    if (nextId != _id) {
      _id = nextId;
      _load();
    }
  }

  Future<void> _load() async {
    if (_id == null) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final complaint =
          await context.read<ComplaintService>().getComplaint(_id!);
      if (!mounted) return;
      setState(() {
        _complaint = complaint;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load complaint details.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_complaint?.complaintNumber ?? 'Complaint Details'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const LoadingIndicator()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.spfBlue,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              _complaint!.category,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          StatusBadge(status: _complaint!.status),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _InfoCard(
                        children: [
                          _InfoRow(
                            label: 'Complaint No.',
                            value: _complaint!.complaintNumber,
                          ),
                          _InfoRow(
                            label: 'Incident Date',
                            value:
                                DateFormatters.date(_complaint!.incidentDate),
                          ),
                          _InfoRow(
                            label: 'Location',
                            value: _complaint!.location,
                          ),
                          _InfoRow(
                            label: 'Submitted',
                            value: DateFormatters.dateTime(
                              _complaint!.createdAt,
                            ),
                          ),
                          _InfoRow(
                            label: 'Last Update',
                            value: DateFormatters.dateTime(
                              _complaint!.updatedAt,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      _InfoCard(
                        title: 'Description',
                        titleColor: AppColors.navy,
                        children: [
                          Text(
                            _complaint!.description,
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      _InfoCard(
                        title: 'Evidence Notes',
                        titleColor: AppColors.textSecondary,
                        children: [
                          Text(
                            _complaint!.evidenceNotes.isNotEmpty
                                ? _complaint!.evidenceNotes
                                : '—',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: _complaint!.evidenceNotes.isEmpty
                                      ? AppColors.textSecondary
                                      : AppColors.navy,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      _InfoCard(
                        title: 'Status Tracking',
                        children: [
                          if (_complaint!.statusHistory.isEmpty)
                            const Text('No status history yet.')
                          else
                            ..._complaint!.statusHistory.reversed.map(
                              (item) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Padding(
                                      padding: EdgeInsets.only(top: 4),
                                      child: Icon(
                                        Icons.circle,
                                        size: 10,
                                        color: AppColors.spfBlue,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          StatusBadge(status: item.status),
                                          const SizedBox(height: 6),
                                          if (item.note.isNotEmpty)
                                            Text(item.note),
                                          const SizedBox(height: 4),
                                          Text(
                                            DateFormatters.dateTime(
                                              item.changedAt,
                                            ),
                                            style:
                                                const TextStyle(fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.children,
    this.title,
    this.titleColor,
  });

  final String? title;
  final Color? titleColor;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Text(
              title!,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: titleColor ?? AppColors.navy,
                  ),
            ),
            const SizedBox(height: 10),
          ],
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
