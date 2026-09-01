import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/route_args.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../layouts/citizen_app_layout.dart';
import '../../../models/ob_record_model.dart';
import '../../../services/ob_record_service.dart';
import '../widgets/ob_record_card.dart';
import '../widgets/ob_record_list_skeleton.dart';
import '../widgets/ob_records_header.dart';

class ObRecordListScreen extends StatefulWidget {
  const ObRecordListScreen({super.key});

  @override
  State<ObRecordListScreen> createState() => _ObRecordListScreenState();
}

class _ObRecordListScreenState extends State<ObRecordListScreen> {
  final _scrollController = ScrollController();
  List<ObRecordModel> _items = [];
  bool _loading = true;
  bool _refreshing = false;
  String? _error;
  String _searchQuery = '';
  int? _lastActiveTab;

  static const _obTabIndex = 2;

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

  List<ObRecordModel> get _visibleItems {
    final query = _searchQuery.trim().toLowerCase();
    if (query.isEmpty) return _items;
    return _items.where((item) {
      return item.obNumber.toLowerCase().contains(query) ||
          (item.complaint?.complaintNumber.toLowerCase().contains(query) ??
              false) ||
          (item.complaint?.category.toLowerCase().contains(query) ?? false) ||
          item.status.toLowerCase().contains(query);
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
      final items = await context.read<ObRecordService>().getMyRecords();
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
          _error = 'Unable to load OB records.';
        }
        _loading = false;
        _refreshing = false;
      });
    }
  }

  Future<void> _refresh() async {
    await _load(silent: _items.isNotEmpty);
  }

  Future<void> _openRecord(ObRecordModel item) async {
    await Navigator.pushNamed(
      context,
      AppRoutes.obDetails,
      arguments: ObRouteRef(
        id: item.id,
        obNumber: item.obNumber,
      ),
    );
    if (!mounted) return;
    await _load(silent: true);
  }

  Widget _buildBody() {
    if (_loading) {
      return const ObRecordListSkeleton();
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
                      'Unable to load OB records.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    if (_error != 'Unable to load OB records.') ...[
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
      final hasSearch = _searchQuery.trim().isNotEmpty;
      return ListView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: EmptyState(
              title: hasSearch ? 'No OB records found' : 'No OB Records Yet',
              message: hasSearch
                  ? 'Try a different search term.'
                  : 'Occurrence Books created from your complaints by Admin/Police will appear here.',
              icon: Icons.folder_off_outlined,
            ),
          ),
        ],
      );
    }

    return ListView.separated(
      controller: _scrollController,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: visible.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = visible[index];
        return ObRecordCard(
          key: ValueKey(item.id),
          item: item,
          onTap: () => _openRecord(item),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeTab = CitizenAppLayout.of(context)?.activeTabIndex;
    if (activeTab == _obTabIndex &&
        _lastActiveTab != _obTabIndex &&
        !_loading) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _load(silent: _items.isNotEmpty);
      });
    }
    _lastActiveTab = activeTab;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          ObRecordsHeader(
            onMenuTap: () => CitizenAppLayout.of(context)?.openDrawer(),
            onRefresh: _refresh,
            refreshing: _refreshing && !_loading,
          ),
          if (!_loading && _error == null && _items.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: TextField(
                onChanged: (value) => setState(() => _searchQuery = value),
                decoration: InputDecoration(
                  hintText: 'Search OB number, complaint, status...',
                  prefixIcon: const Icon(Icons.search_rounded, size: 20),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          onPressed: () => setState(() => _searchQuery = ''),
                          icon: const Icon(Icons.close_rounded, size: 18),
                        )
                      : null,
                  isDense: true,
                  filled: true,
                  fillColor: AppColors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                ),
              ),
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
    );
  }
}
