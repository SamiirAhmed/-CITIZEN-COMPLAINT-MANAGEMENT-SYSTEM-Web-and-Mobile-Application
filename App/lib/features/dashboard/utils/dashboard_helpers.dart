import '../../../models/complaint_model.dart';
import '../../complaints/utils/complaint_helpers.dart';

class DashboardComplaintStats {
  const DashboardComplaintStats({
    required this.total,
    required this.underInvestigation,
    required this.resolved,
    required this.closed,
  });

  final int total;
  final int underInvestigation;
  final int resolved;
  final int closed;

  factory DashboardComplaintStats.fromComplaints(List<ComplaintModel> complaints) {
    final statuses = complaints.map((item) => item.status).toList();
    return DashboardComplaintStats(
      total: complaints.length,
      underInvestigation: countForFilter(statuses, 'under_investigation'),
      resolved: countForFilter(statuses, 'resolved'),
      closed: countForFilter(statuses, 'closed'),
    );
  }
}

class DashboardActivityItem {
  const DashboardActivityItem({
    required this.id,
    required this.type,
    required this.reference,
    required this.eventTitle,
    required this.description,
    required this.status,
    required this.updatedAt,
  });

  final String id;
  final String type;
  final String reference;
  final String eventTitle;
  final String description;
  final String status;
  final DateTime? updatedAt;

  factory DashboardActivityItem.fromUpdate(Map<String, dynamic> update) {
    final type = '${update['type'] ?? 'complaint'}';
    final reference = '${update['title'] ?? ''}'.trim();
    final status = '${update['status'] ?? ''}'.trim();
    final note = '${update['note'] ?? ''}'.trim();
    final updatedAt = DateTime.tryParse('${update['updatedAt']}');
    final id = '${update['id'] ?? ''}'.trim();

    final eventTitle = _eventTitle(type: type, status: status);
    final description = note.isNotEmpty
        ? note
        : reference.isNotEmpty && status.isNotEmpty
            ? '$reference is now $status.'
            : reference.isNotEmpty
                ? 'Update for $reference.'
                : 'Case update recorded.';

    return DashboardActivityItem(
      id: id,
      type: type,
      reference: reference,
      eventTitle: eventTitle,
      description: description,
      status: status,
      updatedAt: updatedAt,
    );
  }
}

List<DashboardActivityItem> buildRecentActivity(
  List<Map<String, dynamic>> updates, {
  int limit = 5,
}) {
  final items = updates
      .map(DashboardActivityItem.fromUpdate)
      .where((item) => item.id.isNotEmpty)
      .toList();

  items.sort((a, b) {
    final left = a.updatedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    final right = b.updatedAt ?? DateTime.fromMillisecondsSinceEpoch(0);
    return right.compareTo(left);
  });

  if (items.length <= limit) return items;
  return items.take(limit).toList();
}

String _eventTitle({required String type, required String status}) {
  final value = status.toLowerCase();

  if (value.contains('reopen')) return 'Case Reopened';
  if (value.contains('closed')) return 'Case Closed';
  if (value.contains('resolved')) return 'Complaint Resolved';
  if (value.contains('investigation completed')) {
    return 'Investigation Completed';
  }
  if (value.contains('investigation')) return 'Investigation Updated';
  if (value.contains('ob created')) return 'OB Record Created';
  if (value.contains('submitted')) return 'Complaint Submitted';
  if (value.contains('verified')) return 'Complaint Verified';
  if (value.contains('reject')) return 'Complaint Rejected';
  if (value.contains('assigned')) return 'Police Officer Assigned';

  if (type == 'ob') return 'OB Update';
  return status.isNotEmpty ? status : 'Complaint Update';
}

String displayFirstName(String fullName) {
  final trimmed = fullName.trim();
  if (trimmed.isEmpty) return 'Citizen';
  final first = trimmed.split(RegExp(r'\s+')).first;
  if (first.isEmpty) return 'Citizen';
  return first[0].toUpperCase() + first.substring(1).toLowerCase();
}
