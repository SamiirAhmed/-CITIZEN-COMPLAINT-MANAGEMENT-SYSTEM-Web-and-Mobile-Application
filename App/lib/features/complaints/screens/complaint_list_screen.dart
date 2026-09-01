import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../layouts/citizen_app_layout.dart';
import '../../../models/complaint_model.dart';
import '../../../services/complaint_service.dart';
import '../utils/complaint_helpers.dart';
import '../widgets/complaint_card.dart';
import '../widgets/complaint_filter_bar.dart';
import '../widgets/complaint_list_skeleton.dart';
import '../widgets/complaints_header.dart';

class ComplaintListScreen extends StatefulWidget {
  const ComplaintListScreen({super.key});

  @override
  State<ComplaintListScreen> createState() => _ComplaintListScreenState();
}

class _ComplaintListScreenState extends State<ComplaintListScreen> {
  final _scrollController = ScrollController();

  List<ComplaintModel> _items = [];
  bool _loading = true;
  bool _refreshing = false;
  String? _error;
  String _filter = 'all';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  List<String> get _statuses => _items.map((item) => item.status).toList();

  List<ComplaintModel> get _visibleItems {
    return _items.where((item) {
      if (!complaintMatchesFilter(item.status, _filter)) return false;
      return complaintMatchesSearch(
        query: _searchQuery,
        complaintNumber: item.complaintNumber,
        category: item.category,
        description: item.description,
        location: item.location,
      );
    }).toList();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _error = null;
      });
    } else {
      setState(() => _refreshing = true);
    }

    try {
      final items = await context.read<ComplaintService>().getMyComplaints();
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
        _refreshing = false;
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        if (!silent || _items.isEmpty) _error = e.message;
        _loading = false;
        _refreshing = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        if (!silent || _items.isEmpty) {
          _error = 'Unable to load complaints.';
        }
        _loading = false;
        _refreshing = false;
      });
    }
  }

  Future<void> _refresh() async {
    await _load(silent: _items.isNotEmpty);
  }

  Future<void> _openComplaint(ComplaintModel item) async {
    await Navigator.pushNamed(
      context,
      AppRoutes.complaintDetails,
      arguments: item.id,
    );
    if (!mounted) return;
    await _load(silent: true);
  }

  Future<void> _submitComplaint() async {
    await Navigator.pushNamed(context, AppRoutes.submitComplaint);
    if (!mounted) return;
    await _load(silent: true);
  }

  Widget _buildBody() {
    if (_loading) {
      return const ComplaintListSkeleton();
    }

    if (_error != null && _items.isEmpty) {
      return ListView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.55,
            child: Center(
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
                      'Unable to load complaints.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    if (_error != 'Unable to load complaints.') ...[
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                    const SizedBox(height: 20),
                    OutlinedButton.icon(
                      onPressed: _refresh,
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      );
    }

    final visible = _visibleItems;

    if (visible.isEmpty) {
      final isAllEmpty = _items.isEmpty;
      final hasSearch = _searchQuery.trim().isNotEmpty;

      return ListView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: EmptyState(
              title: hasSearch
                  ? 'No complaints found'
                  : isAllEmpty
                      ? 'No complaints yet'
                      : 'No complaints found',
              message: hasSearch
                  ? 'Try a different search term or filter.'
                  : isAllEmpty
                      ? "You haven't submitted any complaints yet."
                      : 'There are no complaints in this category.',
              icon: Icons.description_outlined,
              actionLabel: isAllEmpty ? 'Submit Complaint' : null,
              onAction: isAllEmpty ? _submitComplaint : null,
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      controller: _scrollController,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
      itemCount: visible.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = visible[index];
        return ComplaintCard(
          key: ValueKey(item.id),
          item: item,
          onTap: () => _openComplaint(item),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          ComplaintsHeader(
            onMenuTap: () => CitizenAppLayout.of(context)?.openDrawer(),
            onRefresh: _refresh,
            refreshing: _refreshing && !_loading,
          ),
          ComplaintFilterBar(
            selected: _filter,
            statuses: _statuses,
            onChanged: (value) => setState(() => _filter = value),
            searchQuery: _searchQuery,
            onSearchChanged: (value) => setState(() => _searchQuery = value),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              color: AppColors.spfBlue,
              child: _buildBody(),
            ),
          ),
        ],
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: FloatingActionButton.extended(
          onPressed: _submitComplaint,
          backgroundColor: AppColors.spfBlue,
          foregroundColor: Colors.white,
          elevation: 3,
          icon: const Icon(Icons.add_rounded),
          label: const Text(
            'Submit Complaint',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }
}
