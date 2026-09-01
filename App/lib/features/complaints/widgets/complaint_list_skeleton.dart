import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';

class ComplaintListSkeleton extends StatelessWidget {
  const ComplaintListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
      itemCount: 4,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) => const _ComplaintCardSkeleton(),
    );
  }
}

class _ComplaintCardSkeleton extends StatefulWidget {
  const _ComplaintCardSkeleton();

  @override
  State<_ComplaintCardSkeleton> createState() => _ComplaintCardSkeletonState();
}

class _ComplaintCardSkeletonState extends State<_ComplaintCardSkeleton>
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
                  _ShimmerBox(size: 44, radius: 22, alpha: alpha),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ShimmerBox(height: 14, radius: 6, alpha: alpha),
                        const SizedBox(height: 8),
                        _ShimmerBox(height: 12, width: 100, radius: 6, alpha: alpha),
                      ],
                    ),
                  ),
                  _ShimmerBox(height: 24, width: 88, radius: 999, alpha: alpha),
                ],
              ),
              const SizedBox(height: 14),
              _ShimmerBox(height: 12, radius: 6, alpha: alpha),
              const SizedBox(height: 6),
              _ShimmerBox(height: 12, width: 240, radius: 6, alpha: alpha),
              const SizedBox(height: 14),
              _ShimmerBox(height: 56, radius: 12, alpha: alpha),
            ],
          ),
        );
      },
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  const _ShimmerBox({
    required this.alpha,
    this.height,
    this.width,
    this.size,
    required this.radius,
  });

  final double alpha;
  final double? height;
  final double? width;
  final double? size;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final dimension = size ?? height ?? 12;
    return Container(
      height: dimension,
      width: width ?? size ?? double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        color: AppColors.border.withValues(alpha: alpha),
      ),
    );
  }
}
