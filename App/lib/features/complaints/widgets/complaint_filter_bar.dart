import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';
import '../utils/complaint_helpers.dart';

class ComplaintFilterBar extends StatelessWidget {
  const ComplaintFilterBar({
    super.key,
    required this.selected,
    required this.statuses,
    required this.onChanged,
    required this.searchQuery,
    required this.onSearchChanged,
  });

  final String selected;
  final List<String> statuses;
  final ValueChanged<String> onChanged;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.white,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: complaintFilters.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final entry = complaintFilters[index];
                final key = entry.$1;
                final label = entry.$2;
                final count = countForFilter(statuses, key);
                final isSelected = selected == key;

                return _FilterChip(
                  label: label,
                  count: count,
                  selected: isSelected,
                  badgeColor: filterBadgeColor(key),
                  onTap: () => onChanged(key),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            onChanged: onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Search complaint number, category, location...',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              suffixIcon: searchQuery.isNotEmpty
                  ? IconButton(
                      onPressed: () => onSearchChanged(''),
                      icon: const Icon(Icons.close_rounded, size: 18),
                    )
                  : null,
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              filled: true,
              fillColor: AppColors.background,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.count,
    required this.selected,
    required this.badgeColor,
    required this.onTap,
  });

  final String label;
  final int count;
  final bool selected;
  final Color badgeColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.spfBlue : AppColors.white,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        borderRadius: BorderRadius.circular(999),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected ? AppColors.spfBlue : AppColors.border,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (!selected && count > 0) ...[
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: badgeColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.navy,
                  fontWeight: FontWeight.w700,
                  fontSize: 12.5,
                ),
              ),
              if (count > 0) ...[
                const SizedBox(width: 8),
                Container(
                  constraints: const BoxConstraints(minWidth: 20),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: selected
                        ? Colors.white.withValues(alpha: 0.22)
                        : badgeColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '$count',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: selected ? Colors.white : badgeColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
