class SomaliPhone {
  SomaliPhone._();

  /// Digits only without country code (e.g. 61XXXXXXX).
  static String normalize(String input) {
    var digits = input.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('00252')) {
      digits = digits.substring(5);
    } else if (digits.startsWith('252')) {
      digits = digits.substring(3);
    }
    digits = digits.replaceFirst(RegExp(r'^0+'), '');
    return digits;
  }

  static bool isValid(String input) {
    final normalized = normalize(input);
    return RegExp(r'^[67]\d{7,8}$').hasMatch(normalized);
  }

  static String display(String input) {
    final normalized = normalize(input);
    return '+252 $normalized';
  }

  static String mask(String input) {
    final normalized = normalize(input);
    if (normalized.length < 4) return '+252 ****';
    return '+252 ${normalized.substring(0, 2)}****${normalized.substring(normalized.length - 2)}';
  }

  static String? validationError(String? input) {
    final value = (input ?? '').trim();
    if (value.isEmpty) return 'Please enter a valid mobile number.';
    if (!isValid(value)) {
      return 'Please enter a valid Somali mobile number.';
    }
    return null;
  }
}
