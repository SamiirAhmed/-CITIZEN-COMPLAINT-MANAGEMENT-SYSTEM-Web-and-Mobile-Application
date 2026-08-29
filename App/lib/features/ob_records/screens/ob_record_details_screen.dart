import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/error_state.dart';
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
  String? _id;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    final nextId = args?.toString();
    if (nextId == null || nextId.isEmpty) {
      if (_id == null && _loading) {
        setState(() {
          _loading = false;
          _error = 'OB record not found. Open it from My OB Records.';
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
      final record = await context.read<ObRecordService>().getRecord(_id!);
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
                              _record!.obNumber,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          StatusBadge(status: _record!.status),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _Card(
                        title: 'Complaint Information',
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
                              'Location',
                              _record!.complaint?.location ?? '—',
                            ),
                            _row(
                              'Incident Date',
                              DateFormatters.date(
                                _record!.complaint?.incidentDate,
                              ),
                            ),
                            if ((_record!.complaint?.description ?? '')
                                .isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(_record!.complaint!.description),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      _Card(
                        title: 'Assignment',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _row(
                              'Officer',
                              _record!.assignedOfficer?.name ??
                                  'Not assigned yet',
                            ),
                            _row(
                              'Badge',
                              _record!.assignedOfficer?.badgeNumber
                                          .isNotEmpty ==
                                      true
                                  ? _record!.assignedOfficer!.badgeNumber
                                  : '—',
                            ),
                            _row(
                              'Station',
                              _record!.assignedOfficer?.station.isNotEmpty ==
                                      true
                                  ? _record!.assignedOfficer!.station
                                  : '—',
                            ),
                            _row(
                              'Assigned At',
                              DateFormatters.dateTime(_record!.assignedAt),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      _Card(
                        title: 'Investigation Status',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            StatusBadge(status: _record!.status),
                            const SizedBox(height: 10),
                            Text(
                              _record!.citizenSummary.isNotEmpty
                                  ? _record!.citizenSummary
                                  : 'No citizen summary available yet.',
                            ),
                            if (_record!.closureReason.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              _row('Closure', _record!.closureReason),
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
                        title: 'Updates',
                        child: _record!.updates.isEmpty
                            ? const Text('No updates available.')
                            : Column(
                                children: _record!.updates.reversed
                                    .map(
                                      (update) => Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 12),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              update.title,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                            if (update.note.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(update.note),
                                            ],
                                            const SizedBox(height: 4),
                                            Text(
                                              DateFormatters.dateTime(
                                                update.createdAt,
                                              ),
                                              style:
                                                  const TextStyle(fontSize: 12),
                                            ),
                                            const Divider(height: 18),
                                          ],
                                        ),
                                      ),
                                    )
                                    .toList(),
                              ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
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
