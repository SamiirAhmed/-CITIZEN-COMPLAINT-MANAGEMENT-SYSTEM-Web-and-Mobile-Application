final _objectIdPattern = RegExp(r'^[a-fA-F0-9]{24}$');
final _obNumberPattern = RegExp(r'^OB-\d{4}-\d+$', caseSensitive: false);

/// Reference used to open an OB details screen.
class ObRouteRef {
  const ObRouteRef({this.id, this.obNumber});

  final String? id;
  final String? obNumber;

  String? get apiKey {
    if (id != null && id!.isNotEmpty) return id;
    if (obNumber != null && obNumber!.isNotEmpty) return obNumber;
    return null;
  }

  bool get isEmpty => apiKey == null;
}

bool isMongoObjectId(String? value) {
  if (value == null) return false;
  return _objectIdPattern.hasMatch(value.trim());
}

String? parseReferenceId(dynamic value) {
  if (value == null) return null;

  if (value is String) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return null;
    return isMongoObjectId(trimmed) ? trimmed : null;
  }

  if (value is Map) {
    final map = Map<String, dynamic>.from(value);
    for (final key in ['id', '_id', 'recordId', 'obId', 'complaintId']) {
      final parsed = parseReferenceId(map[key]);
      if (parsed != null && parsed.isNotEmpty) return parsed;
    }
  }

  final text = value.toString().trim();
  if (isMongoObjectId(text)) return text;
  return null;
}

String? parseObNumber(dynamic value) {
  if (value == null) return null;
  final text = value.toString().trim().toUpperCase();
  if (_obNumberPattern.hasMatch(text)) return text;
  return extractObNumber(text);
}

ObRouteRef? parseObRouteRef(Object? arguments) {
  if (arguments == null) return null;

  if (arguments is ObRouteRef) return arguments;

  if (arguments is Map) {
    final map = Map<String, dynamic>.from(arguments);
    final id = parseReferenceId(map['id'] ?? map['_id'] ?? map['obId']);
    final obNumber = parseObNumber(map['obNumber'] ?? map['reference']);
    if (id != null || obNumber != null) {
      return ObRouteRef(id: id, obNumber: obNumber);
    }
  }

  if (arguments is String) {
    final trimmed = arguments.trim();
    if (trimmed.isEmpty) return null;
    if (isMongoObjectId(trimmed)) return ObRouteRef(id: trimmed);
    final obNumber = parseObNumber(trimmed);
    if (obNumber != null) return ObRouteRef(obNumber: obNumber);
    return null;
  }

  final id = parseReferenceId(arguments);
  if (id != null) return ObRouteRef(id: id);
  return null;
}

/// Parses MongoDB record IDs passed through [ModalRoute.settings.arguments].
String? parseRouteRecordId(Object? arguments) {
  final obRef = parseObRouteRef(arguments);
  if (obRef?.id != null) return obRef!.id;
  return parseReferenceId(arguments);
}

/// Extracts an OB number such as OB-2026-00003 from free text.
String? extractObNumber(String? text) {
  if (text == null || text.trim().isEmpty) return null;
  final match =
      RegExp(r'\b(OB-\d{4}-\d+)\b', caseSensitive: false).firstMatch(text);
  return match?.group(1)?.toUpperCase();
}

bool _isObLinkPath(String linkPath) {
  final lower = linkPath.toLowerCase();
  return lower.contains('ob-record') || RegExp(r'/ob(?:/|\?|$)').hasMatch(lower);
}

bool _isComplaintLinkPath(String linkPath) {
  return linkPath.toLowerCase().contains('complaint');
}

/// Extracts an OB id from OB notification/link paths only.
String? parseObIdFromLinkPath(String? linkPath) {
  if (linkPath == null || linkPath.trim().isEmpty) return null;
  if (!_isObLinkPath(linkPath)) return null;

  final queryMatch =
      RegExp(r'[?&]id=([a-fA-F0-9]{24})').firstMatch(linkPath);
  if (queryMatch != null) return queryMatch.group(1);

  final pathMatch =
      RegExp(r'/ob-records/([a-fA-F0-9]{24})').firstMatch(linkPath);
  return pathMatch?.group(1);
}

/// Extracts a complaint id from complaint notification/link paths only.
String? parseComplaintIdFromLinkPath(String? linkPath) {
  if (linkPath == null || linkPath.trim().isEmpty) return null;
  if (!_isComplaintLinkPath(linkPath)) return null;

  final queryMatch =
      RegExp(r'[?&]id=([a-fA-F0-9]{24})').firstMatch(linkPath);
  if (queryMatch != null) return queryMatch.group(1);

  final pathMatch =
      RegExp(r'/complaints/([a-fA-F0-9]{24})').firstMatch(linkPath);
  return pathMatch?.group(1);
}

ObRouteRef? parseObRouteFromLinkPath(String? linkPath) {
  final id = parseObIdFromLinkPath(linkPath);
  if (id != null) return ObRouteRef(id: id);
  return null;
}

/// Backward-compatible helper. Prefer [parseObIdFromLinkPath] or
/// [parseComplaintIdFromLinkPath] for notification routing.
String? parseIdFromLinkPath(String? linkPath) {
  return parseObIdFromLinkPath(linkPath) ?? parseComplaintIdFromLinkPath(linkPath);
}
