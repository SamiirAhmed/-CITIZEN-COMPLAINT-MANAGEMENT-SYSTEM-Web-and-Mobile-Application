import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';

class ProfileActionTile extends StatelessWidget {
  const ProfileActionTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    this.primary = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    final bg = primary ? AppColors.spfBlue : AppColors.white;
    final titleColor = primary ? Colors.white : AppColors.navy;
    final subtitleColor = primary
        ? Colors.white.withValues(alpha: 0.82)
        : AppColors.textSecondary;
    final iconBg = primary
        ? Colors.white.withValues(alpha: 0.16)
        : AppColors.spfBlue.withValues(alpha: 0.1);
    final iconColor = primary ? Colors.white : AppColors.spfBlue;
    final chevronColor = primary
        ? Colors.white.withValues(alpha: 0.9)
        : AppColors.spfBlue;

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: primary
                ? null
                : Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: primary
                    ? AppColors.spfBlue.withValues(alpha: 0.22)
                    : AppColors.navy.withValues(alpha: 0.03),
                blurRadius: primary ? 14 : 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: titleColor,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12.5,
                        color: subtitleColor,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: chevronColor),
            ],
          ),
        ),
      ),
    );
  }
}
