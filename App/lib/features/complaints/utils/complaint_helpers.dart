import 'package:flutter/material.dart';

import '../../../application/application_theme.dart';

/// Filter keys used on the My Complaints screen.
const complaintFilters = [
  ('all', 'All'),
  ('submitted', 'Submitted'),
  ('under_investigation', 'Under Investigation'),
  ('resolved', 'Resolved'),
  ('closed', 'Closed'),
];

const _submittedStatuses = {'Submitted'};

const _investigationStatuses = {
  'Under Review',
  'Verified',
  'OB Created',
  'Under Investigation',
  'Investigation Completed',
  'Reopened',
};

const _resolvedStatuses = {'Resolved'};

const _closedStatuses = {'Closed', 'Rejected'};

bool complaintMatchesFilter(String status, String filterKey) {
  switch (filterKey) {
    case 'submitted':
      return _submittedStatuses.contains(status);
    case 'under_investigation':
      return _investigationStatuses.contains(status);
    case 'resolved':
      return _resolvedStatuses.contains(status);
    case 'closed':
      return _closedStatuses.contains(status);
    default:
      return true;
  }
}

int countForFilter(List<String> statuses, String filterKey) {
  if (filterKey == 'all') return statuses.length;
  return statuses.where((status) => complaintMatchesFilter(status, filterKey)).length;
}

ComplaintStatusVisual visualForStatus(String status) {
  final value = status.toLowerCase();

  if (value.contains('reject') || value.contains('closed')) {
    return ComplaintStatusVisual(
      accent: const Color(0xFF64748B),
      background: const Color(0xFFF1F5F9),
      iconAccent: const Color(0xFF64748B),
    );
  }

  if (value.contains('resolved') || value.contains('completed')) {
    return ComplaintStatusVisual(
      accent: AppColors.success,
      background: const Color(0xFFDCFCE7),
      iconAccent: const Color(0xFF15803D),
    );
  }

  if (value.contains('investigation') ||
      value.contains('review') ||
      value.contains('verified') ||
      value.contains('ob created') ||
      value.contains('reopened')) {
    return ComplaintStatusVisual(
      accent: AppColors.warning,
      background: const Color(0xFFFFEDD5),
      iconAccent: const Color(0xFFD97706),
    );
  }

  return ComplaintStatusVisual(
    accent: AppColors.info,
    background: const Color(0xFFE0F2FE),
    iconAccent: AppColors.spfBlue,
  );
}

class ComplaintStatusVisual {
  const ComplaintStatusVisual({
    required this.accent,
    required this.background,
    required this.iconAccent,
  });

  final Color accent;
  final Color background;
  final Color iconAccent;
}

Color filterBadgeColor(String filterKey) {
  switch (filterKey) {
    case 'submitted':
      return AppColors.spfBlue;
    case 'under_investigation':
      return AppColors.warning;
    case 'resolved':
      return AppColors.success;
    case 'closed':
      return const Color(0xFF64748B);
    default:
      return AppColors.spfBlue;
  }
}

bool complaintMatchesSearch({
  required String query,
  required String complaintNumber,
  required String category,
  required String description,
  required String location,
}) {
  if (query.trim().isEmpty) return true;
  final needle = query.trim().toLowerCase();
  return complaintNumber.toLowerCase().contains(needle) ||
      category.toLowerCase().contains(needle) ||
      description.toLowerCase().contains(needle) ||
      location.toLowerCase().contains(needle);
}
