import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/storage/secure_session_storage.dart';
import '../models/citizen_model.dart';
import '../application/application_routes.dart';

class AuthenticationService extends ChangeNotifier {
  AuthenticationService({
    required ApiClient apiClient,
    required SecureSessionStorage storage,
  })  : _api = apiClient,
        _storage = storage {
    _api.onUnauthorized = logoutLocal;
  }

  final ApiClient _api;
  final SecureSessionStorage _storage;

  CitizenModel? _user;
  bool _bootstrapping = true;
  bool _busy = false;
  String? _error;

  CitizenModel? get user => _user;
  bool get isBootstrapping => _bootstrapping;
  bool get isBusy => _busy;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  Future<void> bootstrap() async {
    _bootstrapping = true;
    notifyListeners();

    try {
      final token = await _storage.getToken();
      if (token == null || token.isEmpty) {
        _user = null;
        return;
      }

      final cached = await _storage.getUserJson();
      if (cached != null) {
        _user = CitizenModel.fromJson(
          Map<String, dynamic>.from(jsonDecode(cached) as Map),
        );
        notifyListeners();
      }

      final response = await _api.get(ApiEndpoints.me);
      final data = response['data'] as Map<String, dynamic>? ?? {};
      final userJson = Map<String, dynamic>.from(data['user'] as Map);
      _user = CitizenModel.fromJson(userJson);
      await _storage.saveUserJson(jsonEncode(_user!.toJson()));
    } on ApiException {
      await logoutLocal();
    } catch (_) {
      // Keep cached session if offline; user can refresh later.
    } finally {
      _bootstrapping = false;
      notifyListeners();
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    _busy = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiEndpoints.login,
        auth: false,
        body: {
          'email': email.trim(),
          'password': password,
        },
      );

      await _persistSession(response);
    } on ApiException catch (e) {
      _error = e.message;
      rethrow;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> register({
    required String name,
    required String niraId,
    required String phone,
    required String email,
    required String password,
    required String confirmPassword,
    required String profileImagePath,
  }) async {
    _busy = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.postMultipart(
        ApiEndpoints.register,
        auth: false,
        fileField: 'profileImage',
        filePath: profileImagePath,
        fields: {
          'name': name.trim(),
          'niraId': niraId.trim(),
          'phone': phone.trim(),
          'tell': '',
          'email': email.trim(),
          'password': password,
          'confirmPassword': confirmPassword,
        },
      );

      await _persistSession(response);
    } on ApiException catch (e) {
      _error = e.message;
      rethrow;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> _persistSession(Map<String, dynamic> response) async {
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final token = data['token']?.toString();
    final userJson = Map<String, dynamic>.from(data['user'] as Map);

    if (token == null || token.isEmpty) {
      throw ApiException(message: 'Authentication token missing.');
    }

    final user = CitizenModel.fromJson(userJson);
    if (!user.isCitizen) {
      await _storage.clearSession();
      throw ApiException(
        message: 'This mobile app is for citizens only.',
        statusCode: 403,
      );
    }

    await _storage.saveToken(token);
    await _storage.saveUserJson(jsonEncode(user.toJson()));
    _user = user;
  }

  Future<void> refreshProfile() async {
    final response = await _api.get(ApiEndpoints.me);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final userJson = Map<String, dynamic>.from(data['user'] as Map);
    _user = CitizenModel.fromJson(userJson);
    await _storage.saveUserJson(jsonEncode(_user!.toJson()));
    notifyListeners();
  }

  Future<void> updateLocalUser(CitizenModel user) async {
    _user = user;
    await _storage.saveUserJson(jsonEncode(user.toJson()));
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await _api.post(ApiEndpoints.logout);
    } catch (_) {
      // Always clear local session.
    }
    await logoutLocal();
  }

  Future<void> logoutLocal() async {
    await _storage.clearSession();
    _user = null;
    notifyListeners();
    AppNavigator.returnToRoot();
  }
}
