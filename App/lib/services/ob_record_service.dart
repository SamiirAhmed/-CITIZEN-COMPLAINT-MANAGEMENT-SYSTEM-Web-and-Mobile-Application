import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/utils/route_args.dart';
import '../models/ob_record_model.dart';

class ObRecordService {
  ObRecordService({required ApiClient apiClient}) : _api = apiClient;

  final ApiClient _api;

  Future<List<ObRecordModel>> getMyRecords() async {
    final response = await _api.get(ApiEndpoints.myOBs);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return (data['records'] as List? ?? [])
        .whereType<Map>()
        .map((e) => ObRecordModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<ObRecordModel> getRecord(String key) async {
    final trimmed = key.trim();
    if (trimmed.isEmpty) {
      throw ApiException(message: 'OB record not found.');
    }

    try {
      return await _fetchRecord(trimmed);
    } on ApiException catch (error) {
      if (error.statusCode != 404) rethrow;
      return _resolveFromMyRecords(trimmed);
    }
  }

  Future<ObRecordModel> getRecordByRef(ObRouteRef ref) async {
    final key = ref.apiKey;
    if (key == null || key.isEmpty) {
      throw ApiException(message: 'OB record not found.');
    }

    try {
      return await _fetchRecord(key);
    } on ApiException catch (error) {
      if (error.statusCode != 404) rethrow;
      return _resolveFromMyRecords(
        ref.id ?? ref.obNumber ?? key,
        preferredObNumber: ref.obNumber,
      );
    }
  }

  Future<ObRecordModel> _fetchRecord(String key) async {
    final encoded = Uri.encodeComponent(key);
    final response = await _api.get('${ApiEndpoints.myOBs}/$encoded');
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return ObRecordModel.fromJson(
      Map<String, dynamic>.from(data['record'] as Map),
    );
  }

  Future<ObRecordModel> _resolveFromMyRecords(
    String key, {
    String? preferredObNumber,
  }) async {
    final records = await getMyRecords();
    final normalizedKey = key.toUpperCase();
    final normalizedObNumber = preferredObNumber?.toUpperCase();

    ObRecordModel? match;

    for (final record in records) {
      if (isMongoObjectId(key) && record.id == key) {
        match = record;
        break;
      }
    }

    if (match == null) {
      for (final record in records) {
        if (record.obNumber.toUpperCase() == normalizedKey ||
            (normalizedObNumber != null &&
                record.obNumber.toUpperCase() == normalizedObNumber)) {
          match = record;
          break;
        }
      }
    }

    if (match == null) {
      throw ApiException(message: 'OB record not found.');
    }

    if (match.id != key || !isMongoObjectId(key)) {
      return _fetchRecord(match.id);
    }

    return match;
  }
}
