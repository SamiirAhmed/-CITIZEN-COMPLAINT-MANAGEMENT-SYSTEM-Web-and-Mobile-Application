import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';

class ObRecordListSkeleton extends StatelessWidget {
  const ObRecordListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: 4,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) => const _ObRecordCardSkeleton(),
    );
  }
}

class _ObRecordCardSkeleton extends StatefulWidget {
  const _ObRecordCardSkeleton();

  @override
  State<_ObRecordCardSkeleton> createState() => _ObRecordCardSkeletonState();
}

class _ObRecordCardSkeletonState extends State<_ObRecordCardSkeleton>
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
      builder: (context, _) {
        final alpha = 0.25 + (_controller.value * 0.2);
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _box(44, 44, 22, alpha),
                  const SizedBox(width: 12),
                  Expanded(child: _box(14, double.infinity, 6, alpha)),
                  _box(24, 88, 999, alpha),
                ],
              ),
              const SizedBox(height: 14),
              _box(12, double.infinity, 6, alpha),
              const SizedBox(height: 8),
              _box(12, 220, 6, alpha),
              const SizedBox(height: 14),
              _box(48, double.infinity, 12, alpha),
            ],
          ),
        );
      },
    );
  }

  Widget _box(double height, double width, double radius, double alpha) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        color: AppColors.border.withValues(alpha: alpha),
      ),
    );
  }
}
