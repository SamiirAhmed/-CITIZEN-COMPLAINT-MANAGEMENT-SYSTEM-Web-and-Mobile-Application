class AuthenticationValidator {
  static String? requiredField(String? value, {String field = 'This field'}) {
    if (value == null || value.trim().isEmpty) {
      return '$field is required';
    }
    return null;
  }

  static String? email(String? value) {
    final required = requiredField(value, field: 'Email');
    if (required != null) return required;
    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (!emailRegex.hasMatch(value!.trim())) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  static String? password(String? value) {
    final required = requiredField(value, field: 'Password');
    if (required != null) return required;
    if (value!.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return null;
  }

  static String? confirmPassword(String? value, String? password) {
    final required = requiredField(value, field: 'Confirm password');
    if (required != null) return required;
    if (value != password) {
      return 'Passwords do not match';
    }
    return null;
  }
}
