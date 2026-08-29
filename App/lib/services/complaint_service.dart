import '../core/constants/api_endpoints.dart';
import '../core/network/api_client.dart';
import '../models/complaint_model.dart';

class DashboardData {
  DashboardData({
    required this.totalComplaints,
    required this.activeComplaints,
    required this.activeOBs,
    required this.closedComplaints,
    this.activeComplaint,
    this.activeOB,
    this.latestStatus,
    this.recentUpdates = const [],
  });

  final int totalComplaints;
  final int activeComplaints;
  final int activeOBs;
  final int closedComplaints;
  final ComplaintModel? activeComplaint;
  final Map<String, dynamic>? activeOB;
  final Map<String, dynamic>? latestStatus;
  final List<Map<String, dynamic>> recentUpdates;

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final summary = Map<String, dynamic>.from(json['summary'] as Map? ?? {});
    return DashboardData(
      totalComplaints: (summary['totalComplaints'] as num?)?.toInt() ?? 0,
      activeComplaints: (summary['activeComplaints'] as num?)?.toInt() ?? 0,
      activeOBs: (summary['activeOBs'] as num?)?.toInt() ?? 0,
      closedComplaints: (summary['closedComplaints'] as num?)?.toInt() ?? 0,
      activeComplaint: json['activeComplaint'] is Map
          ? ComplaintModel.fromJson(
              Map<String, dynamic>.from(json['activeComplaint'] as Map),
            )
          : null,
      activeOB: json['activeOB'] is Map
          ? Map<String, dynamic>.from(json['activeOB'] as Map)
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
    required String location,
    String relatedInformation = '',
    String evidenceNotes = '',
  }) async {
    final response = await _api.post(
      ApiEndpoints.submitComplaint,
      body: {
        'category': category,
        'description': description.trim(),
        'incidentDate': incidentDate.toIso8601String(),
        'location': location.trim(),
        'relatedInformation': relatedInformation.trim(),
        'evidenceNotes': evidenceNotes.trim(),
      },
    );

    final data = response['data'] as Map<String, dynamic>? ?? {};
    return ComplaintModel.fromJson(
      Map<String, dynamic>.from(data['complaint'] as Map),
    );
  }
}
