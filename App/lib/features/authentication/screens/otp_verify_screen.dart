import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/widgets/primary_button.dart';
import '../../../services/authentication_service.dart';

class OtpVerifyScreen extends StatefulWidget {
  const OtpVerifyScreen({super.key});

  @override
  State<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends State<OtpVerifyScreen> {
  final List<TextEditingController> _digits =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  String? _error;
  bool _verifying = false;
  bool _resending = false;
  int _resendSeconds = 45;
  Timer? _timer;

  String get _phone {
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map) return (args['phone'] ?? '').toString();
    return '';
  }

  String get _maskedPhone {
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map) {
      return (args['maskedPhone'] ?? args['displayPhone'] ?? '').toString();
    }
    return '';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments;
      final seconds = args is Map
          ? (args['resendAfterSeconds'] as num?)?.toInt() ?? 45
          : 45;
      _startResendTimer(seconds);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _digits) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _startResendTimer(int seconds) {
    _timer?.cancel();
    setState(() => _resendSeconds = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendSeconds <= 1) {
        timer.cancel();
        setState(() => _resendSeconds = 0);
      } else {
        setState(() => _resendSeconds -= 1);
      }
    });
  }

  String get _code => _digits.map((c) => c.text).join();

  Future<void> _verify() async {
    final code = _code;
    if (code.length != 6) {
      setState(() => _error = 'Enter the 6-digit verification code.');
      return;
    }

    setState(() {
      _error = null;
      _verifying = true;
    });

    final auth = context.read<AuthenticationService>();
    try {
      final result = await auth.verifyOtp(phone: _phone, code: code);
      if (!mounted) return;

      if (!result.needsAccountChoice) {
        // AuthGate will show dashboard.
        Navigator.of(context).popUntil((route) => route.isFirst);
        return;
      }

      Navigator.pushReplacementNamed(
        context,
        AppRoutes.accountChoice,
        arguments: {
          'phone': result.phone,
          'maskedPhone': result.maskedPhone,
        },
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _resend() async {
    if (_resendSeconds > 0 || _resending) return;
    setState(() {
      _resending = true;
      _error = null;
    });
    final auth = context.read<AuthenticationService>();
    try {
      final result = await auth.sendOtp(_phone);
      if (!mounted) return;
      _startResendTimer(result.resendAfterSeconds);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('A new verification code was sent.')),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
      int? retry;
      if (e.details is Map) {
        final payload = Map<String, dynamic>.from(e.details as Map);
        final data = payload['data'];
        if (data is Map) {
          retry = (data['retryAfterSeconds'] as num?)?.toInt();
        }
      }
      if (retry != null && retry > 0) _startResendTimer(retry);
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  void _onDigitChanged(int index, String value) {
    if (value.length > 1) {
      final chars = value.replaceAll(RegExp(r'\D'), '').split('');
      for (var i = 0; i < 6; i++) {
        _digits[i].text = i < chars.length ? chars[i] : '';
      }
      final next = chars.length.clamp(0, 5);
      _focusNodes[next].requestFocus();
      if (chars.length >= 6) _verify();
      return;
    }

    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
    if (_code.length == 6) _verify();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.navy,
        elevation: 0,
        title: const Text('Verify your number'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Image.asset(AppConstants.logoAsset, width: 72, height: 72),
              ),
              const SizedBox(height: 20),
              Text(
                'Enter the 6-digit code sent to:',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 6),
              Text(
                _maskedPhone.isNotEmpty ? _maskedPhone : _phone,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.spfBlue,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 28),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: 48,
                    child: TextField(
                      controller: _digits[index],
                      focusNode: _focusNodes[index],
                      textAlign: TextAlign.center,
                      keyboardType: TextInputType.number,
                      maxLength: 1,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      decoration: InputDecoration(
                        counterText: '',
                        filled: true,
                        fillColor: AppColors.white,
                        contentPadding: const EdgeInsets.symmetric(vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.spfBlue,
                            width: 1.6,
                          ),
                        ),
                      ),
                      onChanged: (value) => _onDigitChanged(index, value),
                    ),
                  );
                }),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.error),
                ),
              ],
              const SizedBox(height: 24),
              PrimaryButton(
                label: 'Verify',
                loading: _verifying,
                onPressed: _verifying ? null : _verify,
              ),
              const SizedBox(height: 16),
              Text(
                "Didn't receive the code?",
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: (_resendSeconds > 0 || _resending) ? null : _resend,
                child: Text(
                  _resending
                      ? 'Sending...'
                      : _resendSeconds > 0
                          ? 'Resend OTP in $_resendSeconds seconds'
                          : 'Resend OTP',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
