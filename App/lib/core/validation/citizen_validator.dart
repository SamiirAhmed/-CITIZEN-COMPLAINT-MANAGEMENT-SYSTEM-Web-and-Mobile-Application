class CitizenValidator {
  static final RegExp _lettersOnly = RegExp(r'^[A-Za-z\s]+$');
  static final RegExp _digitsOnly = RegExp(r'^\d+$');
  static final RegExp _niraId = RegExp(r'^\d{11}$');

  static String? requiredField(String? value, {String field = 'This field'}) {
    if (value == null || value.trim().isEmpty) {
      return '$field is required';
    }
    return null;
  }

  static String? name(String? value) {
    final required = requiredField(value, field: 'Name');
    if (required != null) return required;
    final trimmed = value!.trim();
    if (trimmed.length > 30) {
      return 'Name must be at most 30 characters';
    }
    if (!_lettersOnly.hasMatch(trimmed)) {
      return 'Name must contain letters only';
    }
    return null;
  }

  static String? niraId(String? value) {
    final required = requiredField(value, field: 'NIRA ID');
    if (required != null) return required;
    final trimmed = value!.trim();
    if (!_niraId.hasMatch(trimmed)) {
      return 'NIRA ID must be exactly 11 numbers';
    }
    return null;
  }

  static String? phone(String? value) {
    final required = requiredField(value, field: 'Phone');
    if (required != null) return required;
    final cleaned = value!.replaceAll(RegExp(r'[\s-]'), '');
    final digits = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
    if (!_digitsOnly.hasMatch(digits)) {
      return 'Phone must contain numbers only';
    }
    if (digits.length < 7 || digits.length > 15) {
      return 'Enter a valid phone number';
    }
    return null;
  }

  static String? tell(String? value) {
    return requiredField(value, field: 'Tell');
  }
}
