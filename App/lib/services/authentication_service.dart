import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/storage/secure_session_storage.dart';
import '../core/utils/somali_phone.dart';
import '../models/citizen_model.dart';
import '../application/application_routes.dart';

class OtpSendResult {
  OtpSendResult({
    required this.phone,
    required this.maskedPhone,
    required this.expiresInSeconds,
    required this.resendAfterSeconds,
  });

  final String phone;
  final String maskedPhone;
  final int expiresInSeconds;
  final int resendAfterSeconds;
}

class OtpVerifyResult {
  OtpVerifyResult({
    required this.needsAccountChoice,
    required this.alreadyRegistered,
    this.verificationToken,
    this.token,
    this.user,
    this.phone = '',
    this.maskedPhone = '',
    this.profileComplete = false,
    this.hasPassword = false,
  });

  final bool needsAccountChoice;
  final bool alreadyRegistered;
  final String? verificationToken;
  final String? token;
  final CitizenModel? user;
  final String phone;
  final String maskedPhone;
  final bool profileComplete;
  final bool hasPassword;
}

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
  String? _pendingVerificationToken;
  String? _pendingPhone;
  String? _pendingMaskedPhone;

  CitizenModel? get user => _user;
  bool get isBootstrapping => _bootstrapping;
  bool get isBusy => _busy;
  bool get isAuthenticated => _user != null;
  String? get error => _error;
  String? get pendingVerificationToken => _pendingVerificationToken;
  String? get pendingPhone => _pendingPhone;
  String? get pendingMaskedPhone => _pendingMaskedPhone;

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

  Future<OtpSendResult> sendOtp(String phone) async {
    _busy = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiEndpoints.otpSend,
        auth: false,
        body: {'phone': SomaliPhone.normalize(phone)},
      );
      final data = response['data'] as Map<String, dynamic>? ?? {};
      return OtpSendResult(
        phone: (data['phone'] ?? SomaliPhone.display(phone)).toString(),
        maskedPhone:
            (data['maskedPhone'] ?? SomaliPhone.mask(phone)).toString(),
        expiresInSeconds: (data['expiresInSeconds'] as num?)?.toInt() ?? 300,
        resendAfterSeconds: (data['resendAfterSeconds'] as num?)?.toInt() ?? 45,
      );
    } on ApiException catch (e) {
      _error = e.message;
      rethrow;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<OtpVerifyResult> verifyOtp({
    required String phone,
    required String code,
  }) async {
    _busy = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiEndpoints.otpVerify,
        auth: false,
        body: {
          'phone': SomaliPhone.normalize(phone),
          'code': code.trim(),
        },
      );
      final data = response['data'] as Map<String, dynamic>? ?? {};
      final needsChoice = data['needsAccountChoice'] == true;
      final token = data['token']?.toString();
      CitizenModel? user;
      if (data['user'] is Map) {
        user = CitizenModel.fromJson(
          Map<String, dynamic>.from(data['user'] as Map),
        );
      }

      _pendingPhone = (data['phone'] ?? SomaliPhone.display(phone)).toString();
      _pendingMaskedPhone =
          (data['maskedPhone'] ?? SomaliPhone.mask(phone)).toString();
      _pendingVerificationToken = data['verificationToken']?.toString();

      if (!needsChoice && token != null && token.isNotEmpty && user != null) {
        await _persistSessionFromParts(token: token, user: user);
      }

      return OtpVerifyResult(
        needsAccountChoice: needsChoice,
        alreadyRegistered: data['alreadyRegistered'] == true,
        verificationToken: _pendingVerificationToken,
        token: token,
        user: user,
        phone: _pendingPhone ?? '',
        maskedPhone: _pendingMaskedPhone ?? '',
        profileComplete: data['profileComplete'] == true,
        hasPassword: data['hasPassword'] == true,
      );
    } on ApiException catch (e) {
      _error = e.message;
      rethrow;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> skipAccountSetup() async {
    final verificationToken = _pendingVerificationToken;
    if (verificationToken == null || verificationToken.isEmpty) {
      throw ApiException(message: 'Verification session expired. Please try again.');
    }

    _busy = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiEndpoints.otpSkip,
        auth: false,
        body: {'verificationToken': verificationToken},
      );
      await _persistSession(response);
      _clearPendingVerification();
    } on ApiException catch (e) {
      _error = e.message;
      rethrow;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> completeAccount({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    required String region,
    required String district,
    String village = '',
    String area = '',
    String niraId = '',
  }) async {
    final verificationToken = _pendingVerificationToken;
    if (verificationToken == null || verificationToken.isEmpty) {
      throw ApiException(message: 'Verification session expired. Please try again.');
    }

    _busy = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiEndpoints.otpCompleteAccount,
        auth: false,
        body: {
          'verificationToken': verificationToken,
          'name': name.trim(),
          'email': email.trim(),
          'password': password,
          'confirmPassword': confirmPassword,
          'region': region.trim(),
          'district': district.trim(),
          'village': village.trim(),
          'area': area.trim(),
          if (niraId.trim().isNotEmpty) 'niraId': niraId.trim(),
        },
      );
      await _persistSession(response);
      _clearPendingVerification();
    } on ApiException catch (e) {
      _error = e.message;
      rethrow;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> completeProfile({
    required String name,
    required String email,
    required String region,
    required String district,
    String village = '',
    String area = '',
    String niraId = '',
    String? password,
    String? confirmPassword,
  }) async {
    _busy = true;
    _error = null;
    notifyListeners();

    try {
      final body = <String, dynamic>{
        'name': name.trim(),
        'email': email.trim(),
        'region': region.trim(),
        'district': district.trim(),
        'village': village.trim(),
        'area': area.trim(),
        if (niraId.trim().isNotEmpty) 'niraId': niraId.trim(),
      };
      if (password != null && password.isNotEmpty) {
        body['password'] = password;
        body['confirmPassword'] = confirmPassword ?? password;
      }

      final response = await _api.put(
        ApiEndpoints.completeProfile,
        body: body,
      );
      final data = response['data'] as Map<String, dynamic>? ?? {};
      final userJson = Map<String, dynamic>.from(data['user'] as Map);
      _user = CitizenModel.fromJson(userJson);
      await _storage.saveUserJson(jsonEncode(_user!.toJson()));
    } on ApiException catch (e) {
      _error = e.message;
      rethrow;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> login({
    required String identifier,
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
          'identifier': identifier.trim(),
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
    required String region,
    required String district,
    String village = '',
    String area = '',
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
          'region': region.trim(),
          'district': district.trim(),
          'village': village.trim(),
          'area': area.trim(),
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

  void _clearPendingVerification() {
    _pendingVerificationToken = null;
    _pendingPhone = null;
    _pendingMaskedPhone = null;
  }

  Future<void> _persistSessionFromParts({
    required String token,
    required CitizenModel user,
  }) async {
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
    _clearPendingVerification();
  }

  Future<void> _persistSession(Map<String, dynamic> response) async {
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final token = data['token']?.toString();
    final userJson = Map<String, dynamic>.from(data['user'] as Map);

    if (token == null || token.isEmpty) {
      throw ApiException(message: 'Authentication token missing.');
    }

    final user = CitizenModel.fromJson(userJson);
    await _persistSessionFromParts(token: token, user: user);
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
    _clearPendingVerification();
    notifyListeners();
    AppNavigator.returnToRoot();
  }
}
