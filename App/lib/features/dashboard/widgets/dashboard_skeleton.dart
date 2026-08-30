import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';

class DashboardSkeleton extends StatelessWidget {
  const DashboardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      physics: const AlwaysScrollableScrollPhysics(),
      children: const [
        _SkeletonBlock(height: 118, radius: 20),
        SizedBox(height: 18),
        Row(
          children: [
            Expanded(child: _SkeletonBlock(height: 148, radius: 18)),
            SizedBox(width: 12),
            Expanded(child: _SkeletonBlock(height: 148, radius: 18)),
          ],
        ),
        SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _SkeletonBlock(height: 148, radius: 18)),
            SizedBox(width: 12),
            Expanded(child: _SkeletonBlock(height: 148, radius: 18)),
          ],
        ),
        SizedBox(height: 22),
        _SkeletonBlock(height: 18, width: 140, radius: 8),
        SizedBox(height: 12),
        _SkeletonBlock(height: 120, radius: 18),
        SizedBox(height: 22),
        _SkeletonBlock(height: 18, width: 120, radius: 8),
        SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _SkeletonBlock(height: 88, radius: 18)),
            SizedBox(width: 12),
            Expanded(child: _SkeletonBlock(height: 88, radius: 18)),
          ],
        ),
        SizedBox(height: 12),
        _SkeletonBlock(height: 88, radius: 18),
      ],
    );
  }
}

class _SkeletonBlock extends StatelessWidget {
  const _SkeletonBlock({
    required this.height,
    this.width,
    this.radius = 16,
  });

  final double height;
  final double? width;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return _ShimmerBox(
      height: height,
      width: width,
      radius: radius,
    );
  }
}

class _ShimmerBox extends StatefulWidget {
  const _ShimmerBox({
    required this.height,
    this.width,
    required this.radius,
  });

  final double height;
  final double? width;
  final double radius;

  @override
  State<_ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<_ShimmerBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          height: widget.height,
          width: widget.width ?? double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.radius),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                AppColors.border.withValues(alpha: 0.55),
                AppColors.border.withValues(alpha: 0.25 + (_controller.value * 0.2)),
                AppColors.border.withValues(alpha: 0.55),
              ],
            ),
          ),
        );
      },
    );
  }
}
