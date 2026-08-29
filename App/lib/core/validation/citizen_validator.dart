class CitizenValidator {
  static String? requiredField(String? value, {String field = 'This field'}) {
    if (value == null || value.trim().isEmpty) {
      return '$field is required';
    }
    return null;
  }

  static String? name(String? value) {
    final required = requiredField(value, field: 'Name');
    if (required != null) return required;
    if (value!.trim().length > 30) {
      return 'Name must be at most 30 characters';
    }
    return null;
  }

  static String? niraId(String? value) {
    final required = requiredField(value, field: 'NIRA ID');
    if (required != null) return required;
    if (value!.trim().length != 11) {
      return 'NIRA ID must be exactly 11 characters';
    }
    return null;
  }

  static String? phone(String? value) {
    final required = requiredField(value, field: 'Phone');
    if (required != null) return required;
    final cleaned = value!.replaceAll(RegExp(r'[\s-]'), '');
    if (cleaned.length < 7) {
      return 'Enter a valid phone number';
    }
    return null;
  }

  static String? tell(String? value) {
    return requiredField(value, field: 'Tell');
  }
}
