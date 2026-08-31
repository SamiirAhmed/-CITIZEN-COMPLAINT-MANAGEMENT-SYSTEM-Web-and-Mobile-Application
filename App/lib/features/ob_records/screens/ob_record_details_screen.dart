import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/utils/route_args.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../core/widgets/status_badge.dart';
import '../../../models/ob_record_model.dart';
import '../../../services/ob_record_service.dart';

class ObRecordDetailsScreen extends StatefulWidget {
  const ObRecordDetailsScreen({super.key});

  @override
  State<ObRecordDetailsScreen> createState() => _ObRecordDetailsScreenState();
}

class _ObRecordDetailsScreenState extends State<ObRecordDetailsScreen> {
  ObRecordModel? _record;
  bool _loading = true;
  String? _error;
  ObRouteRef? _ref;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final nextRef = parseObRouteRef(ModalRoute.of(context)?.settings.arguments);
    if (nextRef == null || nextRef.isEmpty) {
      if (_ref == null && _loading) {
        setState(() {
          _loading = false;
          _error = 'OB record not found. Open it from OB Records.';
        });
      }
      return;
    }

    if (nextRef.id != _ref?.id || nextRef.obNumber != _ref?.obNumber) {
      _ref = nextRef;
      _load();
    }
  }

  Future<void> _load() async {
    final ref = _ref;
    if (ref == null || ref.isEmpty) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final record =
          await context.read<ObRecordService>().getRecordByRef(ref);
      if (!mounted) return;
      setState(() {
        _record = record;
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
        _error = 'Unable to load OB details.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_record?.obNumber ?? 'OB Details'),
        actions: [
          IconButton(
            onPressed: _ref == null || _ref!.isEmpty ? null : _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: _loading
          ? const LoadingIndicator()
          : _error != null
              ? _ObDetailsError(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  color: AppColors.spfBlue,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              _record!.obNumber,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          StatusBadge(status: _record!.status),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _row(
                        'Created',
                        DateFormatters.dateTime(_record!.createdAt),
                      ),
                      _row(
                        'Last Updated',
                        DateFormatters.dateTime(_record!.updatedAt),
                      ),
                      const SizedBox(height: 12),
                      _Card(
                        title: 'Related Complaint',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _row(
                              'Complaint No.',
                              _record!.complaint?.complaintNumber ?? '—',
                            ),
                            _row(
                              'Category',
                              _record!.complaint?.category ?? '—',
                            ),
                            _row(
                              'Complaint Status',
                              _record!.complaint?.status ?? '—',
                            ),
                            _row(
                              'Location',
                              _record!.complaint?.location ?? '—',
                            ),
                            _row(
                              'Incident Date',
                              DateFormatters.date(
                                _record!.complaint?.incidentDate,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      _Card(
                        title: 'Assigned Officer',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _row(
                              'Officer',
                              _record!.assignedOfficer?.name ??
                                  'Not assigned yet',
                            ),
                            if (_record!.assignedOfficer != null) ...[
                              _row(
                                'Badge',
                                _record!.assignedOfficer!.badgeNumber.isNotEmpty
                                    ? _record!.assignedOfficer!.badgeNumber
                                    : '—',
                              ),
                              _row(
                                'Station',
                                _record!.assignedOfficer!.station.isNotEmpty
                                    ? _record!.assignedOfficer!.station
                                    : '—',
                              ),
                            ],
                            _row(
                              'Assigned At',
                              DateFormatters.dateTime(_record!.assignedAt),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      _Card(
                        title: 'Investigation',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            StatusBadge(status: _record!.status),
                            if (_record!.investigationProgress > 0) ...[
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(999),
                                      child: LinearProgressIndicator(
                                        value: (_record!.investigationProgress
                                                .clamp(0, 100)) /
                                            100,
                                        minHeight: 8,
                                        backgroundColor: AppColors.border,
                                        color: AppColors.spfBlue,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    '${_record!.investigationProgress}%',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                            if (_record!.investigationStartedAt != null)
                              _row(
                                'Started',
                                DateFormatters.dateTime(
                                  _record!.investigationStartedAt,
                                ),
                              ),
                            if (_record!.investigationCompletedAt != null)
                              _row(
                                'Completed',
                                DateFormatters.dateTime(
                                  _record!.investigationCompletedAt,
                                ),
                              ),
                            const SizedBox(height: 10),
                            Text(
                              _record!.citizenSummary.isNotEmpty
                                  ? _record!.citizenSummary
                                  : 'No citizen summary available yet.',
                              style: const TextStyle(height: 1.45),
                            ),
                            if (_record!.closureReason.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              _row('Closure Reason', _record!.closureReason),
                              _row(
                                'Closed At',
                                DateFormatters.dateTime(_record!.closedAt),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      _Card(
                        title: 'History',
                        child: _buildHistory(_record!.updates),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildHistory(List<ObUpdate> updates) {
    if (updates.isEmpty) {
      return const Text('No updates available yet.');
    }

    final items = updates.reversed.toList();
    return Column(
      children: [
        for (var i = 0; i < items.length; i++)
          Padding(
            padding: EdgeInsets.only(bottom: i < items.length - 1 ? 12 : 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  items[i].title,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                if (items[i].note.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(items[i].note),
                ],
                const SizedBox(height: 4),
                Text(
                  DateFormatters.dateTime(items[i].createdAt),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (i < items.length - 1) const Divider(height: 18),
              ],
            ),
          ),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 118,
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

class _ObDetailsError extends StatelessWidget {
  const _ObDetailsError({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline,
                size: 34,
                color: AppColors.error,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.child});

  final String title;
  final Widget child;

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
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}
