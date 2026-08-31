import 'package:flutter/material.dart';

import '../features/authentication/screens/account_choice_screen.dart';
import '../features/authentication/screens/create_account_screen.dart';
import '../features/authentication/screens/login_screen.dart';
import '../features/authentication/screens/mobile_number_screen.dart';
import '../features/authentication/screens/otp_verify_screen.dart';
import '../features/authentication/screens/registration_screen.dart';
import '../features/complaints/screens/complaint_details_screen.dart';
import '../features/complaints/screens/complaint_list_screen.dart';
import '../features/complaints/screens/submit_complaint_screen.dart';
import '../features/dashboard/screens/citizen_dashboard_screen.dart';
import '../features/notifications/screens/notification_list_screen.dart';
import '../features/ob_records/screens/ob_record_details_screen.dart';
import '../features/ob_records/screens/ob_record_list_screen.dart';
import '../features/profile/screens/change_password_screen.dart';
import '../features/profile/screens/citizen_profile_screen.dart';
import '../features/profile/screens/complete_profile_screen.dart';
import '../features/profile/screens/edit_profile_screen.dart';

class AppNavigator {
  static final GlobalKey<NavigatorState> key = GlobalKey<NavigatorState>();

  static NavigatorState? get state => key.currentState;

  /// Clears stacked routes back to the auth gate (first route).
  static void returnToRoot() {
    state?.popUntil((route) => route.isFirst);
  }
}

class AppRoutes {
  static const String mobileNumber = '/auth/mobile';
  static const String otpVerify = '/auth/otp';
  static const String accountChoice = '/auth/account-choice';
  static const String createAccount = '/auth/create-account';
  static const String login = '/login';
  static const String register = '/register';
  static const String dashboard = '/dashboard';
  static const String complaints = '/complaints';
  static const String submitComplaint = '/complaints/submit';
  static const String complaintDetails = '/complaints/details';
  static const String obRecords = '/ob';
  static const String obDetails = '/ob/details';
  static const String notifications = '/notifications';
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String completeProfile = '/profile/complete';
  static const String changePassword = '/profile/change-password';

  static Map<String, WidgetBuilder> get routes => {
        mobileNumber: (_) => const MobileNumberScreen(),
        otpVerify: (_) => const OtpVerifyScreen(),
        accountChoice: (_) => const AccountChoiceScreen(),
        createAccount: (_) => const CreateAccountScreen(),
        login: (_) => const LoginScreen(),
        register: (_) => const RegistrationScreen(),
        dashboard: (_) => const CitizenDashboardScreen(),
        complaints: (_) => const ComplaintListScreen(),
        submitComplaint: (_) => const SubmitComplaintScreen(),
        complaintDetails: (_) => const ComplaintDetailsScreen(),
        obRecords: (_) => const ObRecordListScreen(),
        obDetails: (_) => const ObRecordDetailsScreen(),
        notifications: (_) => const NotificationListScreen(),
        profile: (_) => const CitizenProfileScreen(),
        editProfile: (_) => const EditProfileScreen(),
        completeProfile: (_) => const CompleteProfileScreen(),
        changePassword: (_) => const ChangePasswordScreen(),
      };
}
