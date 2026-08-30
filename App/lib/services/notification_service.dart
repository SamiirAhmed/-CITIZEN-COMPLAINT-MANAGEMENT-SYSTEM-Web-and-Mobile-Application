import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../models/notification_model.dart';

class NotificationListResult {
  NotificationListResult({
    required this.notifications,
    required this.unreadCount,
  });

  final List<AppNotification> notifications;
  final int unreadCount;
}

class NotificationService {
  NotificationService({required ApiClient apiClient}) : _api = apiClient;

  final ApiClient _api;

  Future<NotificationListResult> getNotifications() async {
    final response = await _api.get(ApiEndpoints.notifications);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final list = (data['notifications'] as List? ?? [])
        .whereType<Map>()
        .map((e) => AppNotification.fromJson(Map<String, dynamic>.from(e)))
        .toList();

    return NotificationListResult(
      notifications: list,
      unreadCount: (data['unreadCount'] as num?)?.toInt() ?? 0,
    );
  }

  Future<int> getUnreadCount() async {
    final response = await _api.get(ApiEndpoints.unreadNotifications);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return (data['unreadCount'] as num?)?.toInt() ?? 0;
  }

  Future<AppNotification> markRead(String id) async {
    final response =
        await _api.patch('${ApiEndpoints.notifications}/$id/read');
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return AppNotification.fromJson(
      Map<String, dynamic>.from(data['notification'] as Map),
    );
  }

  Future<void> markAllRead() async {
    await _api.patch(ApiEndpoints.readAllNotifications);
  }
}
