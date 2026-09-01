import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';

class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      physics: const AlwaysScrollableScrollPhysics(),
      children: const [
        _Block(height: 300, radius: 18),
        SizedBox(height: 14),
        _Block(height: 72, radius: 16),
        SizedBox(height: 12),
        _Block(height: 72, radius: 16),
        SizedBox(height: 12),
        _Block(height: 72, radius: 16),
        SizedBox(height: 16),
        _Block(height: 84, radius: 16),
      ],
    );
  }
}

class _Block extends StatefulWidget {
  const _Block({required this.height, this.radius = 16});

  final double height;
  final double radius;

  @override
  State<_Block> createState() => _BlockState();
}

class _BlockState extends State<_Block> with SingleTickerProviderStateMixin {
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
      builder: (context, _) {
        return Container(
          height: widget.height,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.radius),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                AppColors.border.withValues(alpha: 0.55),
                AppColors.border.withValues(
                  alpha: 0.25 + (_controller.value * 0.2),
                ),
                AppColors.border.withValues(alpha: 0.55),
              ],
            ),
          ),
        );
      },
    );
  }
}
