import 'package:flutter/material.dart';

import 'navigation_item.dart';

class CitizenNavigation {
  static const List<NavigationItem> destinations = [
    NavigationItem(
      label: 'Home',
      icon: Icons.home_outlined,
      selectedIcon: Icons.home_rounded,
    ),
    NavigationItem(
      label: 'Complaints',
      icon: Icons.report_outlined,
      selectedIcon: Icons.report_rounded,
    ),
    NavigationItem(
      label: 'OB',
      icon: Icons.folder_outlined,
      selectedIcon: Icons.folder_rounded,
    ),
    NavigationItem(
      label: 'Alerts',
      icon: Icons.notifications_outlined,
      selectedIcon: Icons.notifications_rounded,
    ),
    NavigationItem(
      label: 'Profile',
      icon: Icons.person_outline,
      selectedIcon: Icons.person_rounded,
    ),
  ];

  static const List<String> drawerLabels = [
    'Dashboard',
    'My Complaints',
    'My OB Records',
    'Notifications',
    'Profile',
  ];

  static const List<IconData> drawerIcons = [
    Icons.dashboard_outlined,
    Icons.report_outlined,
    Icons.folder_outlined,
    Icons.notifications_outlined,
    Icons.person_outline,
  ];
}
