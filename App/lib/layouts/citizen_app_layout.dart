import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../application/application_theme.dart';
import '../core/constants/app_constants.dart';
import '../features/complaints/screens/complaint_list_screen.dart';
import '../features/dashboard/screens/citizen_dashboard_screen.dart';
import '../features/notifications/screens/notification_list_screen.dart';
import '../features/ob_records/screens/ob_record_list_screen.dart';
import '../features/profile/screens/citizen_profile_screen.dart';
import '../navigation/citizen_navigation.dart';
import '../services/authentication_service.dart';
import '../services/notification_service.dart';

class CitizenAppLayout extends StatefulWidget {
  const CitizenAppLayout({super.key, this.initialIndex = 0});

  final int initialIndex;

  static CitizenAppLayoutState? of(BuildContext context) {
    return context.findAncestorStateOfType<CitizenAppLayoutState>();
  }

  @override
  State<CitizenAppLayout> createState() => CitizenAppLayoutState();
}

class CitizenAppLayoutState extends State<CitizenAppLayout> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  late int _index;
  int _unread = 0;
  Timer? _pollTimer;

  final _pages = const [
    CitizenDashboardScreen(),
    ComplaintListScreen(),
    ObRecordListScreen(),
    NotificationListScreen(),
    CitizenProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadUnread());
    _pollTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _loadUnread(),
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  void openDrawer() => _scaffoldKey.currentState?.openDrawer();

  void refreshUnreadBadge() => _loadUnread();

  void selectTab(int value) {
    setState(() => _index = value);
    _loadUnread();
  }

  int get activeTabIndex => _index;

  Future<void> _loadUnread() async {
    try {
      final count =
          await context.read<NotificationService>().getUnreadCount();
      if (!mounted) return;
      setState(() => _unread = count);
    } catch (_) {
      // Ignore badge errors; pages handle their own errors.
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthenticationService>().user;
    final destinations = CitizenNavigation.destinations;

    return Scaffold(
      key: _scaffoldKey,
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DrawerHeader(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.spfBlueDark, AppColors.spfBlue],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Image.asset(AppConstants.logoAsset, width: 48, height: 48),
                    const SizedBox(height: 12),
                    Text(
                      user?.name ?? 'Citizen',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ?? '',
                      style: const TextStyle(
                        color: Color(0xFFDCE7F8),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              for (var i = 0; i < CitizenNavigation.drawerLabels.length; i++)
                ListTile(
                  leading: Icon(
                    CitizenNavigation.drawerIcons[i],
                    color: _index == i ? AppColors.spfBlue : null,
                  ),
                  title: Text(
                    CitizenNavigation.drawerLabels[i],
                    style: TextStyle(
                      fontWeight:
                          _index == i ? FontWeight.w700 : FontWeight.w500,
                      color: _index == i ? AppColors.spfBlue : AppColors.navy,
                    ),
                  ),
                  selected: _index == i,
                  onTap: () {
                    Navigator.pop(context);
                    selectTab(i);
                  },
                ),
            ],
          ),
        ),
      ),
      body: IndexedStack(
        index: _index,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          boxShadow: [
            BoxShadow(
              color: AppColors.navy.withValues(alpha: 0.06),
              blurRadius: 18,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: NavigationBar(
            selectedIndex: _index,
            backgroundColor: AppColors.white,
            surfaceTintColor: Colors.transparent,
            indicatorColor: AppColors.spfBlue.withValues(alpha: 0.12),
            elevation: 0,
            height: 68,
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            onDestinationSelected: selectTab,
            destinations: [
              for (var i = 0; i < destinations.length; i++)
                NavigationDestination(
                  icon: i == 3
                      ? Badge(
                          isLabelVisible: _unread > 0,
                          label: Text('$_unread'),
                          backgroundColor: AppColors.error,
                          child: Icon(destinations[i].icon),
                        )
                      : Icon(destinations[i].icon),
                  selectedIcon: i == 3
                      ? Badge(
                          isLabelVisible: _unread > 0,
                          label: Text('$_unread'),
                          backgroundColor: AppColors.error,
                          child: Icon(destinations[i].selectedIcon),
                        )
                      : Icon(destinations[i].selectedIcon),
                  label: destinations[i].label,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
