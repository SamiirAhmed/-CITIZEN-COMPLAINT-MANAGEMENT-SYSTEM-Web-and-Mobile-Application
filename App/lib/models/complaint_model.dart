class StatusHistoryItem {
  StatusHistoryItem({
    required this.status,
    this.note = '',
    this.changedAt,
  });

  final String status;
  final String note;
  final DateTime? changedAt;

  factory StatusHistoryItem.fromJson(Map<String, dynamic> json) {
    return StatusHistoryItem(
      status: (json['status'] ?? '').toString(),
      note: (json['note'] ?? '').toString(),
      changedAt: json['changedAt'] != null
          ? DateTime.tryParse(json['changedAt'].toString())
          : null,
    );
  }
}

class ComplaintModel {
  ComplaintModel({
    required this.id,
    required this.complaintNumber,
    required this.category,
    required this.description,
    required this.location,
    required this.status,
    this.incidentDate,
    this.relatedInformation = '',
    this.evidenceNotes = '',
    this.statusHistory = const [],
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String complaintNumber;
  final String category;
  final String description;
  final String location;
  final String status;
  final DateTime? incidentDate;
  final String relatedInformation;
  final String evidenceNotes;
  final List<StatusHistoryItem> statusHistory;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory ComplaintModel.fromJson(Map<String, dynamic> json) {
    return ComplaintModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      complaintNumber: (json['complaintNumber'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      location: (json['location'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      incidentDate: json['incidentDate'] != null
          ? DateTime.tryParse(json['incidentDate'].toString())
          : null,
      relatedInformation: (json['relatedInformation'] ?? '').toString(),
      evidenceNotes: (json['evidenceNotes'] ?? '').toString(),
      statusHistory: (json['statusHistory'] as List? ?? [])
          .whereType<Map>()
          .map((e) => StatusHistoryItem.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }
}
