import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';

class ProfileSecurityCard extends StatelessWidget {
  const ProfileSecurityCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFFE8F1FB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.spfBlue.withValues(alpha: 0.1)),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -6,
            bottom: -10,
            child: Icon(
              Icons.shield_outlined,
              size: 88,
              color: AppColors.spfBlue.withValues(alpha: 0.08),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.spfBlue.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.verified_user_outlined,
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
                        'Your Security, Our Priority',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: AppColors.spfBlue,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Keep your account secure and always report suspicious activity.',
                        style: TextStyle(
                          fontSize: 12.5,
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
