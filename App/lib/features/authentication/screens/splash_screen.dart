import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';

/// Premium branded splash. Session routing stays in [AuthGate].
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final logoSize = (size.width * 0.28).clamp(88.0, 118.0);

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.35),
            radius: 1.15,
            colors: [
              Color(0xFF1A5BBF),
              AppColors.spfBlue,
              AppColors.spfBlueDark,
            ],
            stops: [0.0, 0.45, 1.0],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              left: -40,
              right: -40,
              bottom: 110,
              child: Opacity(
                opacity: 0.12,
                child: CustomPaint(
                  size: Size(size.width, 90),
                  painter: _SkylinePainter(),
                ),
              ),
            ),
            Positioned(
              top: size.height * 0.12,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  width: logoSize + 56,
                  height: logoSize + 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withValues(alpha: 0.12),
                        blurRadius: 48,
                        spreadRadius: 8,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SafeArea(
              child: Column(
                children: [
                  const Spacer(flex: 3),
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: logoSize + 28,
                        height: logoSize + 28,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.12),
                            width: 1.5,
                          ),
                        ),
                      ),
                      Container(
                        width: logoSize + 12,
                        height: logoSize + 12,
                        padding: const EdgeInsets.all(10),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Image.asset(
                          AppConstants.logoAsset,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 22),
                  Text(
                    AppConstants.organization,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.4,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    AppConstants.appName,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: const Color(0xFFD6E4F8),
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 36,
                        height: 1,
                        color: Colors.white.withValues(alpha: 0.25),
                      ),
                      const SizedBox(width: 10),
                      Icon(
                        Icons.verified_user_rounded,
                        size: 16,
                        color: Colors.white.withValues(alpha: 0.85),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        width: 36,
                        height: 1,
                        color: Colors.white.withValues(alpha: 0.25),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 48),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 22,
                      vertical: 22,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.16),
                      ),
                    ),
                    child: Column(
                      children: [
                        AnimatedBuilder(
                          animation: _controller,
                          builder: (context, child) {
                            return SizedBox(
                              width: 58,
                              height: 58,
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  CustomPaint(
                                    size: const Size(58, 58),
                                    painter: _RingProgressPainter(
                                      progress: _controller.value,
                                    ),
                                  ),
                                  const Icon(
                                    Icons.shield_outlined,
                                    color: Colors.white,
                                    size: 22,
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 14),
                        const Text(
                          'Loading...',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Please wait while we prepare your experience',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.78),
                            fontSize: 12.5,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(flex: 4),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(24, 22, 24, 18),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(28),
                      ),
                    ),
                    child: SafeArea(
                      top: false,
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.verified_user_outlined,
                                size: 18,
                                color: AppColors.spfBlue.withValues(alpha: 0.95),
                              ),
                              const SizedBox(width: 8),
                              const Flexible(
                                child: Text(
                                  'Together for a safer community',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: AppColors.spfBlue,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Report. Track. Stay Safe.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
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

class _RingProgressPainter extends CustomPainter {
  _RingProgressPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 3;
    final track = Paint()
      ..color = Colors.white.withValues(alpha: 0.22)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;
    final active = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, track);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2 + (progress * math.pi * 2),
      math.pi * 1.2,
      false,
      active,
    );
  }

  @override
  bool shouldRepaint(covariant _RingProgressPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

class _SkylinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withValues(alpha: 0.35)
      ..style = PaintingStyle.fill;
    final path = Path()..moveTo(0, size.height);

    final points = <Offset>[
      Offset(0, size.height * 0.72),
      Offset(size.width * 0.08, size.height * 0.62),
      Offset(size.width * 0.12, size.height * 0.62),
      Offset(size.width * 0.14, size.height * 0.38),
      Offset(size.width * 0.18, size.height * 0.38),
      Offset(size.width * 0.2, size.height * 0.55),
      Offset(size.width * 0.28, size.height * 0.5),
      Offset(size.width * 0.34, size.height * 0.28),
      Offset(size.width * 0.42, size.height * 0.28),
      Offset(size.width * 0.46, size.height * 0.48),
      Offset(size.width * 0.55, size.height * 0.42),
      Offset(size.width * 0.62, size.height * 0.2),
      Offset(size.width * 0.7, size.height * 0.2),
      Offset(size.width * 0.74, size.height * 0.45),
      Offset(size.width * 0.82, size.height * 0.4),
      Offset(size.width * 0.88, size.height * 0.55),
      Offset(size.width * 0.94, size.height * 0.5),
      Offset(size.width, size.height * 0.65),
    ];

    for (final point in points) {
      path.lineTo(point.dx, point.dy);
    }
    path
      ..lineTo(size.width, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
