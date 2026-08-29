import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'application/application.dart';
import 'services/authentication_service.dart';
import 'services/complaint_service.dart';
import 'services/notification_service.dart';
import 'services/ob_record_service.dart';
import 'services/citizen_service.dart';
import 'core/network/api_client.dart';
import 'core/storage/secure_session_storage.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final storage = SecureSessionStorage();
  final apiClient = ApiClient(storage: storage);
  final authService =
      AuthenticationService(apiClient: apiClient, storage: storage);
  final citizenService = CitizenService(apiClient: apiClient);
  final complaintService = ComplaintService(apiClient: apiClient);
  final obService = ObRecordService(apiClient: apiClient);
  final notificationService = NotificationService(apiClient: apiClient);

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: apiClient),
        Provider.value(value: storage),
        ChangeNotifierProvider(
          create: (_) => authService..bootstrap(),
        ),
        Provider.value(value: citizenService),
        Provider.value(value: complaintService),
        Provider.value(value: obService),
        Provider.value(value: notificationService),
      ],
      child: const CitizenApp(),
    ),
  );
}
