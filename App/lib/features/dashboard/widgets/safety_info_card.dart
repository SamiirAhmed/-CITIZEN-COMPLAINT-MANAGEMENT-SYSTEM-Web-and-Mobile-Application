import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';

class SafetyInfoCard extends StatelessWidget {
  const SafetyInfoCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(
          colors: [
            AppColors.spfBlue.withValues(alpha: 0.08),
            AppColors.spfBlue.withValues(alpha: 0.03),
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        border: Border.all(color: AppColors.spfBlue.withValues(alpha: 0.12)),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -8,
            top: -8,
            bottom: -8,
            child: Opacity(
              opacity: 0.06,
              child: Image.asset(
                AppConstants.logoAsset,
                fit: BoxFit.contain,
                width: 90,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.spfBlue.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.info_outline_rounded,
                    color: AppColors.spfBlue,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Report. Track. Stay Safe.',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: AppColors.spfBlue,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Together for a safer community.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
