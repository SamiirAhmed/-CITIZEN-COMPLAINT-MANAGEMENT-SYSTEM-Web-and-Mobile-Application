class CitizenModel {
  CitizenModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.niraId = '',
    this.phone = '',
    this.phoneNormalized = '',
    this.phoneVerified = false,
    this.profileComplete = false,
    this.hasPassword = false,
    this.needsProfileCompletion = false,
    this.tell = '',
    this.badgeNumber = '',
    this.station = '',
    this.profileImage = '',
    this.region = '',
    this.district = '',
    this.village = '',
    this.area = '',
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final String niraId;
  final String phone;
  final String phoneNormalized;
  final bool phoneVerified;
  final bool profileComplete;
  final bool hasPassword;
  final bool needsProfileCompletion;
  final String tell;
  final String badgeNumber;
  final String station;
  final String profileImage;
  final String region;
  final String district;
  final String village;
  final String area;

  bool get isCitizen => role == 'citizen';

  factory CitizenModel.fromJson(Map<String, dynamic> json) {
    return CitizenModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? 'citizen').toString(),
      niraId: (json['niraId'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      phoneNormalized: (json['phoneNormalized'] ?? '').toString(),
      phoneVerified: json['phoneVerified'] == true,
      profileComplete: json['profileComplete'] == true,
      hasPassword: json['hasPassword'] == true,
      needsProfileCompletion: json['needsProfileCompletion'] == true ||
          json['profileComplete'] != true,
      tell: (json['tell'] ?? '').toString(),
      badgeNumber: (json['badgeNumber'] ?? '').toString(),
      station: (json['station'] ?? '').toString(),
      profileImage: (json['profileImage'] ?? '').toString(),
      region: (json['region'] ?? '').toString(),
      district: (json['district'] ?? '').toString(),
      village: (json['village'] ?? '').toString(),
      area: (json['area'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'niraId': niraId,
        'phone': phone,
        'phoneNormalized': phoneNormalized,
        'phoneVerified': phoneVerified,
        'profileComplete': profileComplete,
        'hasPassword': hasPassword,
        'needsProfileCompletion': needsProfileCompletion,
        'tell': tell,
        'badgeNumber': badgeNumber,
        'station': station,
        'profileImage': profileImage,
        'region': region,
        'district': district,
        'village': village,
        'area': area,
      };

  CitizenModel copyWith({
    String? name,
    String? phone,
    String? tell,
    String? email,
    String? profileImage,
    String? region,
    String? district,
    String? village,
    String? area,
    bool? phoneVerified,
    bool? profileComplete,
    bool? hasPassword,
    bool? needsProfileCompletion,
  }) {
    return CitizenModel(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role,
      niraId: niraId,
      phone: phone ?? this.phone,
      phoneNormalized: phoneNormalized,
      phoneVerified: phoneVerified ?? this.phoneVerified,
      profileComplete: profileComplete ?? this.profileComplete,
      hasPassword: hasPassword ?? this.hasPassword,
      needsProfileCompletion:
          needsProfileCompletion ?? this.needsProfileCompletion,
      tell: tell ?? this.tell,
      badgeNumber: badgeNumber,
      station: station,
      profileImage: profileImage ?? this.profileImage,
      region: region ?? this.region,
      district: district ?? this.district,
      village: village ?? this.village,
      area: area ?? this.area,
    );
  }
}
