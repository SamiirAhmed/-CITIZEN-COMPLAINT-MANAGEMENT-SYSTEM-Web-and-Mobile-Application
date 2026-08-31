import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../layouts/citizen_app_layout.dart';
import '../../../models/notification_model.dart';
import '../../../services/notification_service.dart';
import '../../../services/ob_record_service.dart';
import '../utils/notification_helpers.dart';
import '../utils/notification_navigation.dart';
import '../widgets/notification_card.dart';
import '../widgets/notification_skeleton.dart';
import '../widgets/notifications_header.dart';

class NotificationListScreen extends StatefulWidget {
  const NotificationListScreen({super.key});

  @override
  State<NotificationListScreen> createState() => _NotificationListScreenState();
}

class _NotificationListScreenState extends State<NotificationListScreen> {
  final _scrollController = ScrollController();

  List<AppNotification> _items = [];
  int _unreadCount = 0;
  bool _loading = true;
  bool _refreshing = false;
  bool _markingAll = false;
  bool _showNewBanner = false;
  String? _error;
  String _filter = 'all';
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _load(silent: true),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  List<AppNotification> get _allowedItems =>
      _items.where(isAllowedNotification).toList();

  List<AppNotification> get _visibleItems {
    final items = _allowedItems;
    if (_filter == 'unread') {
      return items.where((item) => !item.isRead).toList();
    }
    return items;
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
      final result =
          await context.read<NotificationService>().getNotifications();
      if (!mounted) return;

      final previousUnread = _unreadCount;
      final merged = _mergeNotifications(_items, result.notifications);
      final hasNewWhileScrolled =
          silent &&
              result.unreadCount > previousUnread &&
              _scrollController.hasClients &&
              _scrollController.offset > 48;

      setState(() {
        _items = merged;
        _unreadCount = result.unreadCount;
        _loading = false;
        _refreshing = false;
        _showNewBanner = hasNewWhileScrolled;
      });

      if (!silent) {
        CitizenAppLayout.of(context)?.refreshUnreadBadge();
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
        _refreshing = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load notifications.';
        _loading = false;
        _refreshing = false;
      });
    }
  }

  List<AppNotification> _mergeNotifications(
    List<AppNotification> current,
    List<AppNotification> incoming,
  ) {
    if (current.isEmpty) return incoming;

    final byId = {for (final item in current) item.id: item};
    return incoming.map((item) {
      final existing = byId[item.id];
      if (existing == null) return item;
      if (existing.isRead && !item.isRead) return item;
      if (!existing.isRead && item.isRead) {
        return existing.copyWith(isRead: true, readAt: item.readAt);
      }
      return item;
    }).toList();
  }

  void _markItemReadLocally(String id) {
    setState(() {
      _items = _items
          .map(
            (item) => item.id == id
                ? item.copyWith(isRead: true, readAt: DateTime.now())
                : item,
          )
          .toList();
      if (_unreadCount > 0) {
        _unreadCount -= 1;
      }
    });
  }

  Future<void> _markAll() async {
    if (_unreadCount == 0) return;

    setState(() => _markingAll = true);
    try {
      final unreadCount =
          await context.read<NotificationService>().markAllRead();
      if (!mounted) return;
      setState(() {
        _items = _items
            .map(
              (item) => item.copyWith(isRead: true, readAt: DateTime.now()),
            )
            .toList();
        _unreadCount = unreadCount;
        _markingAll = false;
        _showNewBanner = false;
      });
      CitizenAppLayout.of(context)?.refreshUnreadBadge();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _markingAll = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } catch (_) {
      if (mounted) setState(() => _markingAll = false);
    }
  }

  Future<void> _openItem(AppNotification item) async {
    if (!item.isRead) {
      _markItemReadLocally(item.id);
      try {
        final result =
            await context.read<NotificationService>().markRead(item.id);
        if (!mounted) return;
        setState(() {
          final index = _items.indexWhere((entry) => entry.id == item.id);
          if (index >= 0) {
            _items[index] = result.notification;
          }
          _unreadCount = result.unreadCount;
        });
        CitizenAppLayout.of(context)?.refreshUnreadBadge();
      } catch (_) {}
    }

    if (!mounted) return;

    final complaintId = resolveComplaintNotificationId(item);
    final obRef = resolveObNotificationRef(item);
    final type = item.type.toLowerCase();

    if (obRef != null && !obRef.isEmpty) {
      try {
        await context.read<ObRecordService>().getRecordByRef(obRef);
        if (!mounted) return;
        await Navigator.pushNamed(
          context,
          AppRoutes.obDetails,
          arguments: obRef,
        );
        return;
      } on ApiException {
        if (complaintId != null) {
          if (!mounted) return;
          await Navigator.pushNamed(
            context,
            AppRoutes.complaintDetails,
            arguments: complaintId,
          );
          return;
        }
      }
      if (!mounted) return;
      await Navigator.pushNamed(
        context,
        AppRoutes.obDetails,
        arguments: obRef,
      );
      return;
    }

    if (complaintId != null) {
      await Navigator.pushNamed(
        context,
        AppRoutes.complaintDetails,
        arguments: complaintId,
      );
    } else if (type.contains('registered') || type.contains('account')) {
      CitizenAppLayout.of(context)?.selectTab(4);
    }
  }

  Future<void> _refresh() async {
    await _load();
  }

  void _showLatestNotifications() {
    setState(() => _showNewBanner = false);
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
      );
    }
    _load(silent: true);
  }

  Widget _buildBody() {
    if (_loading) {
      return const NotificationListSkeleton();
    }

    if (_error != null) {
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
                      'Unable to load notifications.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    if (_error != 'Unable to load notifications.') ...[
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
      return ListView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.55,
            child: EmptyState(
              title: _filter == 'unread'
                  ? 'No unread notifications'
                  : 'No notifications',
              message: _filter == 'unread'
                  ? 'You have read all your notifications.'
                  : "You're all caught up.",
              icon: Icons.notifications_none_outlined,
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
        return NotificationCard(
          key: ValueKey(item.id),
          item: item,
          onTap: () => _openItem(item),
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
          NotificationsHeader(
            unreadCount: _unreadCount,
            onMenuTap: () => CitizenAppLayout.of(context)?.openDrawer(),
            onRefresh: _refresh,
            onMarkAllRead: _markAll,
            markingAll: _markingAll,
            refreshing: _refreshing && !_loading,
          ),
          NotificationFilterBar(
            selected: _filter,
            unreadCount: _unreadCount,
            onChanged: (value) => setState(() => _filter = value),
          ),
          if (_showNewBanner)
            NewNotificationsBanner(onTap: _showLatestNotifications),
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
