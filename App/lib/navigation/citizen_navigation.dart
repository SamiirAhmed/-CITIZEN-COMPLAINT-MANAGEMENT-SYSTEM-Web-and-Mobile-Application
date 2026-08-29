import 'package:flutter/material.dart';

import 'navigation_item.dart';

class CitizenNavigation {
  static const List<NavigationItem> destinations = [
    NavigationItem(
      label: 'Home',
      icon: Icons.dashboard_outlined,
      selectedIcon: Icons.dashboard,
    ),
    NavigationItem(
      label: 'Complaints',
      icon: Icons.report_outlined,
      selectedIcon: Icons.report,
    ),
    NavigationItem(
      label: 'OB',
      icon: Icons.folder_outlined,
      selectedIcon: Icons.folder,
    ),
    NavigationItem(
      label: 'Alerts',
      icon: Icons.notifications_outlined,
      selectedIcon: Icons.notifications,
    ),
    NavigationItem(
      label: 'Profile',
      icon: Icons.person_outline,
      selectedIcon: Icons.person,
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
