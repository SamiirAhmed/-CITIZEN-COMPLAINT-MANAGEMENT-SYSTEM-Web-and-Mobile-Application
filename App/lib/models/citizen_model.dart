class CitizenModel {
  CitizenModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.niraId = '',
    this.phone = '',
    this.tell = '',
    this.badgeNumber = '',
    this.station = '',
    this.profileImage = '',
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final String niraId;
  final String phone;
  final String tell;
  final String badgeNumber;
  final String station;
  final String profileImage;

  bool get isCitizen => role == 'citizen';

  factory CitizenModel.fromJson(Map<String, dynamic> json) {
    return CitizenModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? 'citizen').toString(),
      niraId: (json['niraId'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      tell: (json['tell'] ?? '').toString(),
      badgeNumber: (json['badgeNumber'] ?? '').toString(),
      station: (json['station'] ?? '').toString(),
      profileImage: (json['profileImage'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'niraId': niraId,
        'phone': phone,
        'tell': tell,
        'badgeNumber': badgeNumber,
        'station': station,
        'profileImage': profileImage,
      };

  CitizenModel copyWith({
    String? name,
    String? phone,
    String? tell,
    String? profileImage,
  }) {
    return CitizenModel(
      id: id,
      name: name ?? this.name,
      email: email,
      role: role,
      niraId: niraId,
      phone: phone ?? this.phone,
      tell: tell ?? this.tell,
      badgeNumber: badgeNumber,
      station: station,
      profileImage: profileImage ?? this.profileImage,
    );
  }
}
