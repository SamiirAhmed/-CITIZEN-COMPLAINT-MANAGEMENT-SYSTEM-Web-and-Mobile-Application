import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'application_routes.dart';
import 'application_theme.dart';
import '../core/constants/app_constants.dart';
import '../services/authentication_service.dart';
import '../features/authentication/screens/mobile_number_screen.dart';
import '../features/authentication/screens/splash_screen.dart';
import '../layouts/citizen_app_layout.dart';

class CitizenApp extends StatelessWidget {
  const CitizenApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SPO Citizen Portal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      navigatorKey: AppNavigator.key,
      routes: AppRoutes.routes,
      home: const AuthGate(),
    );
  }
}

/// Keeps authentication above the navigation stack so login, logout,
/// and session expiry always return to the correct screen.
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _minSplashDone = false;

  @override
  void initState() {
    super.initState();
    Future<void>.delayed(AppConstants.splashDelay, () {
      if (mounted) setState(() => _minSplashDone = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthenticationService>();
    final showSplash = auth.isBootstrapping || !_minSplashDone;

    if (showSplash) {
      return const SplashScreen();
    }

    if (auth.isAuthenticated) {
      return const CitizenAppLayout();
    }

    return const MobileNumberScreen();
  }
}
