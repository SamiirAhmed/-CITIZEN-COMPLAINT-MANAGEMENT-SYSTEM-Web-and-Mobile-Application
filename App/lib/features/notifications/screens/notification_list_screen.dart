import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_state.dart';
import '../../../core/widgets/loading_indicator.dart';
import '../../../layouts/citizen_app_layout.dart';
import '../../../models/notification_model.dart';
import '../../../services/notification_service.dart';

class NotificationListScreen extends StatefulWidget {
  const NotificationListScreen({super.key});

  @override
  State<NotificationListScreen> createState() => _NotificationListScreenState();
}

class _NotificationListScreenState extends State<NotificationListScreen> {
  List<AppNotification> _items = [];
  bool _loading = true;
  bool _markingAll = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result =
          await context.read<NotificationService>().getNotifications();
      if (!mounted) return;
      setState(() {
        _items = result.notifications;
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
        _error = 'Unable to load notifications.';
        _loading = false;
      });
    }
  }

  Future<void> _markAll() async {
    setState(() => _markingAll = true);
    try {
      await context.read<NotificationService>().markAllRead();
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } finally {
      if (mounted) setState(() => _markingAll = false);
    }
  }

  Future<void> _openItem(AppNotification item) async {
    if (!item.isRead) {
      try {
        await context.read<NotificationService>().markRead(item.id);
        if (mounted) {
          CitizenAppLayout.of(context)?.refreshUnreadBadge();
        }
      } catch (_) {}
    }

    if (!mounted) return;

    final relatedOb = item.relatedOB;
    final relatedComplaint = item.relatedComplaint;

    if (relatedOb != null && relatedOb.isNotEmpty) {
      await Navigator.pushNamed(
        context,
        AppRoutes.obDetails,
        arguments: relatedOb,
      );
    } else if (relatedComplaint != null && relatedComplaint.isNotEmpty) {
      await Navigator.pushNamed(
        context,
        AppRoutes.complaintDetails,
        arguments: relatedComplaint,
      );
    }

    if (!mounted) return;
    await _load();
    if (mounted) {
      CitizenAppLayout.of(context)?.refreshUnreadBadge();
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = _items.where((e) => !e.isRead).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => CitizenAppLayout.of(context)?.openDrawer(),
        ),
        actions: [
          if (unread > 0)
            TextButton(
              onPressed: _markingAll ? null : _markAll,
              child: Text(
                _markingAll ? 'Updating...' : 'Mark all read',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.spfBlue,
        child: _loading
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 220, child: LoadingIndicator(message: 'Loading notifications...')),
                ],
              )
            : _error != null
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.6,
                        child: ErrorState(message: _error!, onRetry: _load),
                      ),
                    ],
                  )
                : _items.isEmpty
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          SizedBox(
                            height: MediaQuery.of(context).size.height * 0.6,
                            child: const EmptyState(
                              title: 'No Notifications',
                              message:
                                  'Updates about your complaints and OB records will appear here.',
                              icon: Icons.notifications_none_outlined,
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length,
                        separatorBuilder: (_, index) =>
                            const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = _items[index];
                          return Material(
                            color: item.isRead
                                ? Colors.white
                                : AppColors.spfBlue.withValues(alpha: 0.06),
                            borderRadius: BorderRadius.circular(16),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () => _openItem(item),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    CircleAvatar(
                                      backgroundColor: AppColors.spfBlue
                                          .withValues(alpha: 0.12),
                                      child: Icon(
                                        item.isRead
                                            ? Icons.notifications_none
                                            : Icons.notifications_active,
                                        color: AppColors.spfBlue,
                                        size: 18,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  item.title,
                                                  style: TextStyle(
                                                    fontWeight: item.isRead
                                                        ? FontWeight.w600
                                                        : FontWeight.w800,
                                                  ),
                                                ),
                                              ),
                                              if (!item.isRead)
                                                Container(
                                                  width: 8,
                                                  height: 8,
                                                  decoration:
                                                      const BoxDecoration(
                                                    color: AppColors.spfBlue,
                                                    shape: BoxShape.circle,
                                                  ),
                                                ),
                                            ],
                                          ),
                                          const SizedBox(height: 6),
                                          Text(item.message),
                                          const SizedBox(height: 8),
                                          Text(
                                            DateFormatters.dateTime(
                                              item.createdAt,
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
                          );
                        },
                      ),
      ),
    );
  }
}
