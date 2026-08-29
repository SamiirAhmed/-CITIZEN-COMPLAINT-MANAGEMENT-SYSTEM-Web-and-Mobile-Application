import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:citizen_complaint_app/application/application_theme.dart';
import 'package:citizen_complaint_app/core/network/api_client.dart';
import 'package:citizen_complaint_app/core/storage/secure_session_storage.dart';
import 'package:citizen_complaint_app/features/authentication/screens/login_screen.dart';
import 'package:citizen_complaint_app/services/authentication_service.dart';

void main() {
  testWidgets('Login screen renders SPF branding', (tester) async {
    final storage = SecureSessionStorage();
    final api = ApiClient(storage: storage);
    final auth = AuthenticationService(apiClient: api, storage: storage);

    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: auth,
        child: MaterialApp(
          theme: AppTheme.light,
          home: const LoginScreen(),
        ),
      ),
    );

    expect(find.text('Citizen Complaint Portal'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
  });
}
