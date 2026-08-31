import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';

class NotificationsHeader extends StatelessWidget {
  const NotificationsHeader({
    super.key,
    required this.unreadCount,
    required this.onMenuTap,
    required this.onRefresh,
    required this.onMarkAllRead,
    this.markingAll = false,
    this.refreshing = false,
  });

  final int unreadCount;
  final VoidCallback onMenuTap;
  final VoidCallback onRefresh;
  final VoidCallback onMarkAllRead;
  final bool markingAll;
  final bool refreshing;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.spfBlue,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(4, 4, 8, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: onMenuTap,
                    icon: const Icon(Icons.menu_rounded, color: Colors.white),
                    tooltip: 'Menu',
                  ),
                  Expanded(
                    child: Row(
                      children: [
                        const Text(
                          'Notifications',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                          ),
                        ),
                        if (unreadCount > 0) ...[
                          const SizedBox(width: 10),
                          Container(
                            constraints: const BoxConstraints(minWidth: 24),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              unreadCount > 99 ? '99+' : '$unreadCount',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: AppColors.spfBlue,
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (unreadCount > 0)
                    TextButton.icon(
                      onPressed: markingAll ? null : onMarkAllRead,
                      icon: markingAll
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(
                              Icons.done_all_rounded,
                              size: 18,
                              color: Colors.white,
                            ),
                      label: Text(
                        markingAll ? 'Updating' : 'Mark all read',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  IconButton(
                    onPressed: refreshing ? null : onRefresh,
                    icon: refreshing
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.refresh_rounded, color: Colors.white),
                    tooltip: 'Refresh',
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 16),
                child: Text(
                  'Stay updated with important activities.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.82),
                    fontSize: 13.5,
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class NotificationFilterBar extends StatelessWidget {
  const NotificationFilterBar({
    super.key,
    required this.selected,
    required this.unreadCount,
    required this.onChanged,
  });

  final String selected;
  final int unreadCount;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.white,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        children: [
          _FilterChip(
            label: 'All',
            selected: selected == 'all',
            onTap: () => onChanged('all'),
          ),
          const SizedBox(width: 10),
          _FilterChip(
            label: 'Unread',
            selected: selected == 'unread',
            badgeCount: unreadCount,
            onTap: () => onChanged('unread'),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.badgeCount = 0,
  });

  final String label;
  final bool selected;
  final int badgeCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.spfBlue : AppColors.background,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.navy,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
              if (badgeCount > 0) ...[
                const SizedBox(width: 8),
                Container(
                  constraints: const BoxConstraints(minWidth: 20),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: selected
                        ? Colors.white.withValues(alpha: 0.22)
                        : AppColors.spfBlue.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    badgeCount > 99 ? '99+' : '$badgeCount',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: selected ? Colors.white : AppColors.spfBlue,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class NewNotificationsBanner extends StatelessWidget {
  const NewNotificationsBanner({
    super.key,
    required this.onTap,
  });

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.spfBlue.withValues(alpha: 0.08),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              const Icon(
                Icons.notifications_active_outlined,
                size: 18,
                color: AppColors.spfBlue,
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'New notifications',
                  style: TextStyle(
                    color: AppColors.spfBlue,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
              const Icon(
                Icons.keyboard_arrow_up_rounded,
                color: AppColors.spfBlue,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
