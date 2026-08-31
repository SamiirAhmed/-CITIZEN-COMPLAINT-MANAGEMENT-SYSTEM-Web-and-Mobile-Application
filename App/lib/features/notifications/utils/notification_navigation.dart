import '../../../models/notification_model.dart';
import '../../../core/utils/route_args.dart';

const _obNotificationTypes = {
  'ob_created',
  'ob_reopened',
  'ob_closed',
  'ob_resolved',
  'police_assigned',
  'ob_assigned_officer',
  'investigation_started',
  'investigation_update',
  'investigation_completed',
  'evidence_added',
  'ob_status_officer',
};

bool isObRelatedNotification(AppNotification item) {
  final type = item.type.toLowerCase().trim();
  if (_obNotificationTypes.contains(type)) return true;
  if (type.contains('ob_') || type.startsWith('ob')) return true;
  if (type.contains('investigation')) return true;
  if (type.contains('police_assigned')) return true;
  if (type.contains('reopen') && type.contains('ob')) return true;
  return parseReferenceId(item.relatedOB) != null;
}

ObRouteRef? resolveObNotificationRef(AppNotification item) {
  final obId = parseReferenceId(item.relatedOB) ??
      parseObIdFromLinkPath(item.linkPath);

  if (obId != null) {
    return ObRouteRef(
      id: obId,
      obNumber: extractObNumber(item.message) ?? extractObNumber(item.title),
    );
  }

  if (!isObRelatedNotification(item)) return null;

  final obNumber =
      extractObNumber(item.message) ?? extractObNumber(item.title);
  if (obNumber != null) return ObRouteRef(obNumber: obNumber);

  return null;
}

String? resolveComplaintNotificationId(AppNotification item) {
  return parseReferenceId(item.relatedComplaint) ??
      parseComplaintIdFromLinkPath(item.linkPath);
}
