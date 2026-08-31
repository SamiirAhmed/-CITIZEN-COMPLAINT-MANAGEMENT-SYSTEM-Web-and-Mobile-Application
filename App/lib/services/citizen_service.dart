import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../models/citizen_model.dart';

class CitizenService {
  CitizenService({required ApiClient apiClient}) : _api = apiClient;

  final ApiClient _api;

  Future<CitizenModel> updateProfile({
    required String name,
    required String phone,
    required String tell,
    String region = '',
    String district = '',
    String village = '',
    String area = '',
  }) async {
    final response = await _api.put(
      ApiEndpoints.profile,
      body: {
        'name': name.trim(),
        'phone': phone.trim(),
        'tell': tell.trim(),
        if (district.trim().isNotEmpty) 'region': region.trim(),
        if (district.trim().isNotEmpty) 'district': district.trim(),
        if (district.trim().isNotEmpty) 'village': village.trim(),
        if (district.trim().isNotEmpty) 'area': area.trim(),
      },
    );

    final data = response['data'] as Map<String, dynamic>? ?? {};
    return CitizenModel.fromJson(
      Map<String, dynamic>.from(data['user'] as Map),
    );
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    await _api.put(
      ApiEndpoints.changePassword,
      body: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      },
    );
  }
}
