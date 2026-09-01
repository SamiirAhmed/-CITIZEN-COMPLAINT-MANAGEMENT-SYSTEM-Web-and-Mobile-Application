import '../core/network/api_client.dart';
import '../core/constants/api_endpoints.dart';

class DistrictOption {
  const DistrictOption({
    required this.district,
    required this.region,
  });

  final String district;
  final String region;

  String get label => district;

  @override
  bool operator ==(Object other) =>
      other is DistrictOption &&
      other.district == district &&
      other.region == region;

  @override
  int get hashCode => Object.hash(district, region);
}

class GeographyService {
  GeographyService(this._api);

  final ApiClient _api;

  Future<List<String>> listRegions() async {
    final response = await _api.get(ApiEndpoints.geographyRegions, auth: false);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final regions = data['regions'] as List<dynamic>? ?? [];
    return regions.map((item) => item.toString()).toList();
  }

  /// All districts from the database (with region for save).
  Future<List<DistrictOption>> listAllDistricts() async {
    final response =
        await _api.get(ApiEndpoints.geographyAllDistricts, auth: false);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final region = (data['region'] ?? 'Banaadir').toString();
    final districts = data['districts'] as List<dynamic>? ?? [];
    return districts.map((item) {
      if (item is Map) {
        return DistrictOption(
          district: (item['district'] ?? '').toString(),
          region: (item['region'] ?? region).toString(),
        );
      }
      return DistrictOption(district: item.toString(), region: region);
    }).where((item) => item.district.isNotEmpty).toList();
  }

  Future<List<String>> listDistricts(String region) async {
    final response =
        await _api.get(ApiEndpoints.geographyDistricts(region), auth: false);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final raw = data['districts'] as List<dynamic>? ??
        data['names'] as List<dynamic>? ??
        [];
    return raw.map((item) {
      if (item is Map) return (item['district'] ?? '').toString();
      return item.toString();
    }).where((item) => item.isNotEmpty).toList();
  }

  /// Banaadir district names for dropdowns.
  Future<List<String>> listBanaadirDistricts() async {
    final options = await listAllDistricts();
    return options.map((item) => item.district).toList()
      ..sort((a, b) => a.compareTo(b));
  }

  Future<List<String>> listVillages(String region, String district) async {
    final response = await _api.get(
      ApiEndpoints.geographyVillages(region, district),
      auth: false,
    );
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final villages = data['villages'] as List<dynamic>? ?? [];
    return villages
        .map((item) => item.toString())
        .where((item) => item.isNotEmpty)
        .toList();
  }

  Future<List<String>> listAreas(
    String region,
    String district,
    String village,
  ) async {
    final response = await _api.get(
      ApiEndpoints.geographyAreas(region, district, village),
      auth: false,
    );
    final data = response['data'] as Map<String, dynamic>? ?? {};
    final areas = data['areas'] as List<dynamic>? ?? [];
    return areas
        .map((item) => item.toString())
        .where((item) => item.isNotEmpty)
        .toList();
  }
}
