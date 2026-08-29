import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
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

  Future<ObRecordModel> getRecord(String id) async {
    final response = await _api.get('${ApiEndpoints.myOBs}/$id');
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return ObRecordModel.fromJson(
      Map<String, dynamic>.from(data['record'] as Map),
    );
  }
}
