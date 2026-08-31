import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';

class ComplaintsHeader extends StatelessWidget {
  const ComplaintsHeader({
    super.key,
    required this.onMenuTap,
    required this.onRefresh,
    this.refreshing = false,
  });

  final VoidCallback onMenuTap;
  final VoidCallback onRefresh;
  final bool refreshing;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.spfBlue,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(4, 4, 8, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: onMenuTap,
                    icon: const Icon(Icons.menu_rounded, color: Colors.white),
                    tooltip: 'Menu',
                  ),
                  const Expanded(
                    child: Text(
                      'My Complaints',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: refreshing ? null : onRefresh,
                    icon: refreshing
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.refresh_rounded, color: Colors.white),
                    tooltip: 'Refresh',
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.only(left: 16, right: 16),
                child: Text(
                  'Track all your submitted complaints',
                  style: TextStyle(
                    color: Color(0xFFDCE7F8),
                    fontSize: 13.5,
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
