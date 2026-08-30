import '../core/network/api_client.dart';

class GeographyService {
  GeographyService({required ApiClient apiClient}) : _api = apiClient;

  final ApiClient _api;

  Future<List<String>> listRegions() async {
    final response = await _api.get('/geography/regions', auth: false);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final regions = data['regions'] as List<dynamic>? ?? [];
    return regions.map((item) => item.toString()).toList();
  }

  Future<List<String>> listDistricts(String region) async {
    final response = await _api.get(
      '/geography/districts?region=${Uri.encodeComponent(region)}',
      auth: false,
    );
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final districts = data['districts'] as List<dynamic>? ?? [];
    return districts.map((item) => item.toString()).toList();
  }
}
