class ObUpdate {
  ObUpdate({
    required this.title,
    this.note = '',
    this.createdAt,
  });

  final String title;
  final String note;
  final DateTime? createdAt;

  factory ObUpdate.fromJson(Map<String, dynamic> json) {
    return ObUpdate(
      title: (json['title'] ?? '').toString(),
      note: (json['note'] ?? '').toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

class ObAssignedOfficer {
  ObAssignedOfficer({
    required this.id,
    required this.name,
    this.badgeNumber = '',
    this.station = '',
  });

  final String id;
  final String name;
  final String badgeNumber;
  final String station;

  factory ObAssignedOfficer.fromJson(Map<String, dynamic> json) {
    return ObAssignedOfficer(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      badgeNumber: (json['badgeNumber'] ?? '').toString(),
      station: (json['station'] ?? '').toString(),
    );
  }
}

class ObComplaintInfo {
  ObComplaintInfo({
    required this.id,
    required this.complaintNumber,
    required this.category,
    required this.status,
    this.description = '',
    this.location = '',
    this.incidentDate,
  });

  final String id;
  final String complaintNumber;
  final String category;
  final String status;
  final String description;
  final String location;
  final DateTime? incidentDate;

  factory ObComplaintInfo.fromJson(Map<String, dynamic> json) {
    return ObComplaintInfo(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      complaintNumber: (json['complaintNumber'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      location: (json['location'] ?? '').toString(),
      incidentDate: json['incidentDate'] != null
          ? DateTime.tryParse(json['incidentDate'].toString())
          : null,
    );
  }
}

class ObRecordModel {
  ObRecordModel({
    required this.id,
    required this.obNumber,
    required this.status,
    this.citizenSummary = '',
    this.closureReason = '',
    this.closedAt,
    this.assignedAt,
    this.assignedOfficer,
    this.complaint,
    this.updates = const [],
    this.investigationProgress = 0,
    this.investigationStartedAt,
    this.investigationCompletedAt,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String obNumber;
  final String status;
  final String citizenSummary;
  final String closureReason;
  final DateTime? closedAt;
  final DateTime? assignedAt;
  final ObAssignedOfficer? assignedOfficer;
  final ObComplaintInfo? complaint;
  final List<ObUpdate> updates;
  final int investigationProgress;
  final DateTime? investigationStartedAt;
  final DateTime? investigationCompletedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory ObRecordModel.fromJson(Map<String, dynamic> json) {
    return ObRecordModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      obNumber: (json['obNumber'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      citizenSummary: (json['citizenSummary'] ?? '').toString(),
      closureReason: (json['closureReason'] ?? '').toString(),
      closedAt: json['closedAt'] != null
          ? DateTime.tryParse(json['closedAt'].toString())
          : null,
      assignedAt: json['assignedAt'] != null
          ? DateTime.tryParse(json['assignedAt'].toString())
          : null,
      assignedOfficer: json['assignedOfficer'] is Map
          ? ObAssignedOfficer.fromJson(
              Map<String, dynamic>.from(json['assignedOfficer'] as Map),
            )
          : null,
      complaint: json['complaint'] is Map
          ? ObComplaintInfo.fromJson(
              Map<String, dynamic>.from(json['complaint'] as Map),
            )
          : null,
      updates: (json['updates'] as List? ?? [])
          .whereType<Map>()
          .map((e) => ObUpdate.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      investigationProgress: (json['investigationProgress'] as num?)?.toInt() ?? 0,
      investigationStartedAt: json['investigationStartedAt'] != null
          ? DateTime.tryParse(json['investigationStartedAt'].toString())
          : null,
      investigationCompletedAt: json['investigationCompletedAt'] != null
          ? DateTime.tryParse(json['investigationCompletedAt'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }
}
