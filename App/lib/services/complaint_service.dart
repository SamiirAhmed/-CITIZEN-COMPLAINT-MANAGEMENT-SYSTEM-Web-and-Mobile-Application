import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../models/complaint_model.dart';

class DashboardData {
  DashboardData({
    required this.totalComplaints,
    required this.totalOBRecords,
    required this.activeComplaints,
    required this.activeOBs,
    required this.activeCases,
    required this.closedCases,
    required this.closedComplaints,
    this.activeComplaint,
    this.activeOB,
    this.recentOB,
    this.latestStatus,
    this.recentUpdates = const [],
  });

  final int totalComplaints;
  final int totalOBRecords;
  final int activeComplaints;
  final int activeOBs;
  final int activeCases;
  final int closedCases;
  final int closedComplaints;
  final ComplaintModel? activeComplaint;
  final Map<String, dynamic>? activeOB;
  final Map<String, dynamic>? recentOB;
  final Map<String, dynamic>? latestStatus;
  final List<Map<String, dynamic>> recentUpdates;

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final summary = Map<String, dynamic>.from(json['summary'] as Map? ?? {});
    return DashboardData(
      totalComplaints: (summary['totalComplaints'] as num?)?.toInt() ?? 0,
      totalOBRecords: (summary['totalOBRecords'] as num?)?.toInt() ?? 0,
      activeComplaints: (summary['activeComplaints'] as num?)?.toInt() ?? 0,
      activeOBs: (summary['activeOBs'] as num?)?.toInt() ?? 0,
      activeCases: (summary['activeCases'] as num?)?.toInt() ??
          (summary['activeOBs'] as num?)?.toInt() ??
          0,
      closedCases: (summary['closedCases'] as num?)?.toInt() ?? 0,
      closedComplaints: (summary['closedComplaints'] as num?)?.toInt() ?? 0,
      activeComplaint: json['activeComplaint'] is Map
          ? ComplaintModel.fromJson(
              Map<String, dynamic>.from(json['activeComplaint'] as Map),
            )
          : null,
      activeOB: json['activeOB'] is Map
          ? Map<String, dynamic>.from(json['activeOB'] as Map)
          : null,
      recentOB: json['recentOB'] is Map
          ? Map<String, dynamic>.from(json['recentOB'] as Map)
          : null,
      latestStatus: json['latestStatus'] is Map
          ? Map<String, dynamic>.from(json['latestStatus'] as Map)
          : null,
      recentUpdates: (json['recentUpdates'] as List? ?? [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList(),
    );
  }
}

class ComplaintService {
  ComplaintService({required ApiClient apiClient}) : _api = apiClient;

  final ApiClient _api;

  Future<List<String>> getCategories() async {
    final response = await _api.get(ApiEndpoints.categories);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return (data['categories'] as List? ?? [])
        .map((e) => e.toString())
        .toList();
  }

  Future<DashboardData> getDashboard() async {
    final response = await _api.get(ApiEndpoints.dashboard);
    final data = Map<String, dynamic>.from(response['data'] as Map? ?? {});
    return DashboardData.fromJson(data);
  }

  Future<List<ComplaintModel>> getMyComplaints() async {
    final response = await _api.get(ApiEndpoints.myComplaints);
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return (data['complaints'] as List? ?? [])
        .whereType<Map>()
        .map((e) => ComplaintModel.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<ComplaintModel> getComplaint(String id) async {
    final response = await _api.get('${ApiEndpoints.myComplaints}/$id');
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return ComplaintModel.fromJson(
      Map<String, dynamic>.from(data['complaint'] as Map),
    );
  }

  Future<ComplaintModel> submitComplaint({
    required String category,
    required String description,
    required DateTime incidentDate,
    required String region,
    required String district,
    String village = '',
    String area = '',
    String location = '',
    String relatedInformation = '',
    String evidenceNotes = '',
    List<String> evidenceFilePaths = const [],
  }) async {
    final trimmedVillage = village.trim();
    final trimmedArea = area.trim();
    final trimmedLocation = location.trim().isNotEmpty
        ? location.trim()
        : [district.trim(), trimmedVillage, trimmedArea]
            .where((part) => part.isNotEmpty)
            .join(', ');

    final fields = <String, String>{
      'category': category.trim(),
      'description': description.trim(),
      'incidentDate': incidentDate.toIso8601String(),
      'region': region.trim(),
      'district': district.trim(),
      'location': trimmedLocation,
      if (trimmedVillage.isNotEmpty) 'village': trimmedVillage,
      if (trimmedArea.isNotEmpty) 'area': trimmedArea,
      if (relatedInformation.trim().isNotEmpty)
        'relatedInformation': relatedInformation.trim(),
      if (evidenceNotes.trim().isNotEmpty)
        'evidenceNotes': evidenceNotes.trim(),
    };

    final Map<String, dynamic> response;
    if (evidenceFilePaths.isEmpty) {
      response = await _api.post(ApiEndpoints.submitComplaint, body: fields);
    } else {
      response = await _api.postMultipartFiles(
        ApiEndpoints.submitComplaint,
        fields: fields,
        files: evidenceFilePaths
            .map(
              (path) => MultipartFileInput(
                field: 'evidence',
                path: path,
              ),
            )
            .toList(),
      );
    }

    final data = response['data'] as Map<String, dynamic>? ?? {};
    return ComplaintModel.fromJson(
      Map<String, dynamic>.from(data['complaint'] as Map),
    );
  }
}
