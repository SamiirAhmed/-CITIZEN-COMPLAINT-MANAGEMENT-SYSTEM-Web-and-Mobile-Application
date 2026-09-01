import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../constants/api_endpoints.dart';
import '../storage/secure_session_storage.dart';
import 'api_exception.dart';

typedef UnauthorizedHandler = Future<void> Function();

class MultipartFileInput {
  const MultipartFileInput({
    required this.field,
    required this.path,
    this.filename,
  });

  final String field;
  final String path;
  final String? filename;
}

class ApiClient {
  ApiClient({
    required SecureSessionStorage storage,
    http.Client? httpClient,
  })  : _storage = storage,
        _http = httpClient ?? http.Client();

  final SecureSessionStorage _storage;
  final http.Client _http;
  UnauthorizedHandler? onUnauthorized;

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    var base = ApiEndpoints.baseUrl.endsWith('/')
        ? ApiEndpoints.baseUrl.substring(0, ApiEndpoints.baseUrl.length - 1)
        : ApiEndpoints.baseUrl;
    if (base.contains('yahyeali.com') || base.startsWith('https://')) {
      base = ApiEndpoints.baseUrl;
    }
    final normalized = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$base$normalized').replace(
      queryParameters: query?.map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      ),
    );
  }

  Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (auth) {
      final token = await _storage.getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? query,
    bool auth = true,
  }) {
    return _send(
      () async => _http.get(
        _uri(path, query),
        headers: await _headers(auth: auth),
      ),
      auth: auth,
    );
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) {
    return _send(
      () async => _http.post(
        _uri(path),
        headers: await _headers(auth: auth),
        body: jsonEncode(body ?? {}),
      ),
      auth: auth,
    );
  }

  Future<Map<String, dynamic>> put(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) {
    return _send(
      () async => _http.put(
        _uri(path),
        headers: await _headers(auth: auth),
        body: jsonEncode(body ?? {}),
      ),
      auth: auth,
    );
  }

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) {
    return _send(
      () async => _http.patch(
        _uri(path),
        headers: await _headers(auth: auth),
        body: jsonEncode(body ?? {}),
      ),
      auth: auth,
    );
  }

  Future<Map<String, dynamic>> delete(
    String path, {
    bool auth = true,
  }) {
    return _send(
      () async => _http.delete(
        _uri(path),
        headers: await _headers(auth: auth),
      ),
      auth: auth,
    );
  }

  Future<Map<String, dynamic>> postMultipart(
    String path, {
    Map<String, String>? fields,
    required String fileField,
    required String filePath,
    String? filename,
    bool auth = true,
  }) {
    return postMultipartFiles(
      path,
      fields: fields,
      files: [
        MultipartFileInput(
          field: fileField,
          path: filePath,
          filename: filename,
        ),
      ],
      auth: auth,
    );
  }

  Future<Map<String, dynamic>> postMultipartFiles(
    String path, {
    Map<String, String>? fields,
    List<MultipartFileInput> files = const [],
    bool auth = true,
  }) {
    return _send(() async {
      final request = http.MultipartRequest('POST', _uri(path));
      final headers = <String, String>{
        'Accept': 'application/json',
      };
      if (auth) {
        final token = await _storage.getToken();
        if (token != null && token.isNotEmpty) {
          headers['Authorization'] = 'Bearer $token';
        }
      }
      request.headers.addAll(headers);
      if (fields != null) {
        request.fields.addAll(fields);
      }
      for (final file in files) {
        request.files.add(
          await http.MultipartFile.fromPath(
            file.field,
            file.path,
            filename: file.filename,
          ),
        );
      }
      final streamed = await _http.send(request);
      return http.Response.fromStream(streamed);
    }, auth: auth);
  }

  Future<Map<String, dynamic>> _send(
    Future<http.Response> Function() request, {
    bool auth = true,
  }) async {
    try {
      final response = await request().timeout(ApiEndpoints.timeout);
      return _handleResponse(response, auth: auth);
    } on TimeoutException {
      throw ApiException(
        message:
            'The server is taking too long to respond. Make sure the backend is running (cd Backend && npm run dev) and MongoDB is connected.',
      );
    } on http.ClientException {
      throw ApiException(message: _connectionErrorMessage());
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException(message: _connectionErrorMessage());
    }
  }

  String _connectionErrorMessage() {
    final api = ApiEndpoints.baseUrl;
    if (api.contains('10.0.2.2')) {
      return 'Cannot reach the backend at $api. On your PC, run: cd Backend && npm run dev';
    }
    return 'Cannot reach the backend at $api. Start the backend with: cd Backend && npm run dev';
  }

  Future<Map<String, dynamic>> _handleResponse(
    http.Response response, {
    bool auth = true,
  }) async {
    Map<String, dynamic> payload = {};

    if (response.body.isNotEmpty) {
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          payload = decoded;
        } else {
          payload = {'data': decoded};
        }
      } catch (_) {
        throw ApiException(
          message: 'Invalid response from server.',
          statusCode: response.statusCode,
        );
      }
    }

    if (response.statusCode == 401) {
      if (auth && onUnauthorized != null) {
        await onUnauthorized!();
      }
      throw ApiException(
        message: payload['message']?.toString() ??
            'Session expired. Please log in again.',
        statusCode: 401,
        details: payload,
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return payload;
    }

    throw ApiException(
      message: payload['message']?.toString() ??
          'Request failed (${response.statusCode}).',
      statusCode: response.statusCode,
      details: payload,
    );
  }
}
