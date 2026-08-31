import 'dart:async';

import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../../../models/notification_model.dart';
import '../utils/notification_helpers.dart';

class NotificationCard extends StatelessWidget {
  const NotificationCard({
    super.key,
    required this.item,
    required this.onTap,
  });

  final AppNotification item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final visual = visualFor(item);
    final actor = actorLabel(item);
    final messageStyle = TextStyle(
      fontSize: 13.5,
      height: 1.45,
      color: item.isRead ? AppColors.textSecondary : AppColors.navy,
    );

    return Material(
      color: item.isRead
          ? AppColors.white
          : AppColors.spfBlue.withValues(alpha: 0.04),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: item.isRead
                  ? AppColors.border
                  : AppColors.spfBlue.withValues(alpha: 0.18),
            ),
          ),
          child: Stack(
            children: [
              if (!item.isRead)
                Positioned(
                  left: 0,
                  top: 18,
                  bottom: 18,
                  child: Container(
                    width: 3,
                    decoration: BoxDecoration(
                      color: AppColors.spfBlue,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: visual.background,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        visual.icon,
                        color: visual.accent,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!item.isRead)
                                Padding(
                                  padding: const EdgeInsets.only(top: 6, right: 6),
                                  child: Container(
                                    width: 7,
                                    height: 7,
                                    decoration: const BoxDecoration(
                                      color: AppColors.spfBlue,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                              Expanded(
                                child: Text(
                                  item.title,
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight:
                                        item.isRead ? FontWeight.w600 : FontWeight.w800,
                                    color: AppColors.navy,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              NotificationRelativeTime(
                                createdAt: item.createdAt,
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          RichText(
                            text: TextSpan(
                              style: messageStyle,
                              children: messageSpans(
                                item.message,
                                baseStyle: messageStyle,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              if (actor.isNotEmpty) ...[
                                Icon(
                                  Icons.person_outline_rounded,
                                  size: 14,
                                  color: AppColors.textSecondary.withValues(alpha: 0.9),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    'By $actor',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ] else
                                const Spacer(),
                              _StatusPill(isRead: item.isRead, accent: visual.accent),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({
    required this.isRead,
    required this.accent,
  });

  final bool isRead;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isRead
            ? AppColors.background
            : accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        isRead ? 'Read' : 'Unread',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: isRead ? AppColors.textSecondary : accent,
        ),
      ),
    );
  }
}

class NotificationRelativeTime extends StatefulWidget {
  const NotificationRelativeTime({
    super.key,
    required this.createdAt,
  });

  final DateTime? createdAt;

  @override
  State<NotificationRelativeTime> createState() =>
      _NotificationRelativeTimeState();
}

class _NotificationRelativeTimeState extends State<NotificationRelativeTime> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Text(
      compactRelativeTime(widget.createdAt),
      style: const TextStyle(
        fontSize: 12,
        color: AppColors.textSecondary,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}
