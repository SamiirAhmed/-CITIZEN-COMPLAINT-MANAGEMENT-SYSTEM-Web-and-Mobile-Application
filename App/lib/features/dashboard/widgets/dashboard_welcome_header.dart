import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';

class DashboardWelcomeHeader extends StatelessWidget {
  const DashboardWelcomeHeader({
    super.key,
    required this.citizenName,
    required this.onMenuTap,
    required this.onNotificationsTap,
    this.unreadCount = 0,
  });

  final String citizenName;
  final VoidCallback onMenuTap;
  final VoidCallback onNotificationsTap;
  final int unreadCount;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.spfBlue,
      child: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Positioned(
              right: -24,
              top: 8,
              child: Opacity(
                opacity: 0.07,
                child: Image.asset(
                  AppConstants.logoAsset,
                  width: 120,
                  height: 120,
                  fit: BoxFit.contain,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 4, 8, 18),
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
                      const Spacer(),
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          IconButton(
                            onPressed: onNotificationsTap,
                            icon: const Icon(
                              Icons.notifications_none_rounded,
                              color: Colors.white,
                            ),
                            tooltip: 'Notifications',
                          ),
                          if (unreadCount > 0)
                            Positioned(
                              right: 8,
                              top: 8,
                              child: Container(
                                constraints: const BoxConstraints(minWidth: 18),
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 5),
                                height: 18,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: AppColors.error,
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(
                                    color: AppColors.spfBlue,
                                    width: 1.5,
                                  ),
                                ),
                                child: Text(
                                  unreadCount > 99 ? '99+' : '$unreadCount',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Welcome, $citizenName',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.4,
                                  height: 1.15,
                                ),
                              ),
                            ),
                            const Text('👋', style: TextStyle(fontSize: 22)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "We're here to help and protect you.",
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.86),
                            fontSize: 13.5,
                            height: 1.35,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppConstants.organization,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.68),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
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
    );
  }
}
