import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'application_routes.dart';
import 'application_theme.dart';
import '../core/constants/app_constants.dart';
import '../services/authentication_service.dart';
import '../features/authentication/screens/login_screen.dart';
import '../layouts/citizen_app_layout.dart';

class CitizenApp extends StatelessWidget {
  const CitizenApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SPF Citizen Portal',
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
      return const _SplashScreen();
    }

    if (auth.isAuthenticated) {
      return const CitizenAppLayout();
    }

    return const LoginScreen();
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.spfBlueDark,
              AppColors.spfBlue,
              Color(0xFF1A5BBF),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                AppConstants.logoAsset,
                width: 110,
                height: 110,
              ),
              const SizedBox(height: 20),
              Text(
                AppConstants.organization,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                AppConstants.appName,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: const Color(0xFFDCE7F8),
                    ),
              ),
              const SizedBox(height: 36),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.6,
                  valueColor: AlwaysStoppedAnimation(Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
