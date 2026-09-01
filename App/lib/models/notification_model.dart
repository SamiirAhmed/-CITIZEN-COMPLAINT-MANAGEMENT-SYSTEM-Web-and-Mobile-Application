import '../core/utils/route_args.dart';

class AppNotification {
  AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    this.status = 'info',
    this.actorName,
    this.actorRole,
    this.relatedComplaint,
    this.relatedOB,
    this.relatedUser,
    this.linkPath,
    this.readAt,
    this.createdAt,
  });

  final String id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final String status;
  final String? actorName;
  final String? actorRole;
  final String? relatedComplaint;
  final String? relatedOB;
  final String? relatedUser;
  final String? linkPath;
  final DateTime? readAt;
  final DateTime? createdAt;

  AppNotification copyWith({
    bool? isRead,
    DateTime? readAt,
  }) {
    return AppNotification(
      id: id,
      title: title,
      message: message,
      type: type,
      isRead: isRead ?? this.isRead,
      status: status,
      actorName: actorName,
      actorRole: actorRole,
      relatedComplaint: relatedComplaint,
      relatedOB: relatedOB,
      relatedUser: relatedUser,
      linkPath: linkPath,
      readAt: readAt ?? this.readAt,
      createdAt: createdAt,
    );
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      type: (json['type'] ?? 'general').toString(),
      isRead: json['isRead'] == true,
      status: (json['status'] ?? 'info').toString(),
      actorName: json['actorName']?.toString(),
      actorRole: json['actorRole']?.toString(),
      relatedComplaint: parseReferenceId(json['relatedComplaint']),
      relatedOB: parseReferenceId(json['relatedOB']),
      relatedUser: parseReferenceId(json['relatedUser']),
      linkPath: json['linkPath']?.toString(),
      readAt: json['readAt'] != null
          ? DateTime.tryParse(json['readAt'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}
