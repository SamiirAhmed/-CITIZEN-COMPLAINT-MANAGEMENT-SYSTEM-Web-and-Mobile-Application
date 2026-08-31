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
  static const String otpSend = '/auth/otp/send';
  static const String otpVerify = '/auth/otp/verify';
  static const String otpSkip = '/auth/otp/skip';
  static const String otpCompleteAccount = '/auth/otp/complete-account';
  static const String completeProfile = '/auth/complete-profile';

  // Geography
  static const String geographyRegions = '/geography/regions';
  static const String geographyAllDistricts = '/geography/districts';
  static String geographyDistricts(String region) =>
      '/geography/districts?region=${Uri.encodeComponent(region)}';
  static String geographyVillages(String region, String district) =>
      '/geography/villages?region=${Uri.encodeComponent(region)}&district=${Uri.encodeComponent(district)}';
  static String geographyAreas(String region, String district, String village) =>
      '/geography/areas?region=${Uri.encodeComponent(region)}&district=${Uri.encodeComponent(district)}&village=${Uri.encodeComponent(village)}';

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
