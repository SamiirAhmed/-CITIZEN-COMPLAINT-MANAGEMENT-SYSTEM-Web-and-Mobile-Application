import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

class ApiEndpoints {
  /// Local backend only. Remote/hosted URLs are never used.
  static String get baseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://127.0.0.1:5000/api';
  }

  static const Duration timeout = Duration(seconds: 25);

  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String profile = '/auth/profile';
  static const String changePassword = '/auth/change-password';

  // Complaints
  static const String categories = '/complaints/categories';
  static const String dashboard = '/complaints/dashboard';
  static const String myComplaints = '/complaints/mine';
  static const String submitComplaint = '/complaints';

  // OB
  static const String myOBs = '/ob/mine';

  // Notifications
  static const String notifications = '/notifications';
  static const String unreadNotifications = '/notifications/unread-count';
  static const String readAllNotifications = '/notifications/read-all';
}
