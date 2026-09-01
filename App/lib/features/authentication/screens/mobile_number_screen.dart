import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../application/application_routes.dart';
import '../../../application/application_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/somali_phone.dart';
import '../../../services/authentication_service.dart';

class MobileNumberScreen extends StatefulWidget {
  const MobileNumberScreen({super.key});

  @override
  State<MobileNumberScreen> createState() => _MobileNumberScreenState();
}

class _MobileNumberScreenState extends State<MobileNumberScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _phoneFocus = FocusNode();
  String? _error;
  bool _sending = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _phoneFocus.dispose();
    super.dispose();
  }

  Future<void> _continue() async {
    FocusScope.of(context).unfocus();
    if (_sending) return;
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _error = null;
      _sending = true;
    });

    final auth = context.read<AuthenticationService>();
    final phone = _phoneController.text.trim();

    try {
      final result = await auth.sendOtp(phone);
      if (!mounted) return;
      Navigator.pushNamed(
        context,
        AppRoutes.otpVerify,
        arguments: {
          'phone': phone,
          'displayPhone': result.phone,
          'maskedPhone': result.maskedPhone,
          'resendAfterSeconds': result.resendAfterSeconds,
        },
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message.isNotEmpty
            ? e.message
            : 'Unable to send OTP. Please check your number and try again.';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error =
            'Unable to send OTP. Please check your number and try again.';
      });
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFF3F7FC),
              Color(0xFFEAF1FA),
              Color(0xFFF8FAFC),
            ],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              right: -30,
              top: 80,
              child: Opacity(
                opacity: 0.045,
                child: Image.asset(
                  AppConstants.logoAsset,
                  width: 180,
                  height: 180,
                ),
              ),
            ),
            Positioned(
              left: -20,
              bottom: 40,
              child: Opacity(
                opacity: 0.04,
                child: Icon(
                  Icons.shield_outlined,
                  size: 160,
                  color: AppColors.spfBlue,
                ),
              ),
            ),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + bottomInset * 0.05),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 8),
                          Center(
                            child: Container(
                              width: 86,
                              height: 86,
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.spfBlue
                                        .withValues(alpha: 0.1),
                                    blurRadius: 18,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: Image.asset(
                                AppConstants.logoAsset,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            AppConstants.organization,
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                  color: AppColors.spfBlue,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.3,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            AppConstants.appName,
                            textAlign: TextAlign.center,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                          ),
                          const SizedBox(height: 14),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 40,
                                height: 1,
                                color: AppColors.border,
                              ),
                              const SizedBox(width: 10),
                              const Icon(
                                Icons.verified_user_outlined,
                                size: 16,
                                color: AppColors.spfBlue,
                              ),
                              const SizedBox(width: 10),
                              Container(
                                width: 40,
                                height: 1,
                                color: AppColors.border,
                              ),
                            ],
                          ),
                          const SizedBox(height: 22),
                          Container(
                            padding: const EdgeInsets.fromLTRB(20, 22, 20, 18),
                            decoration: BoxDecoration(
                              color: AppColors.white,
                              borderRadius: BorderRadius.circular(22),
                              border: Border.all(color: AppColors.border),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.spfBlue
                                      .withValues(alpha: 0.07),
                                  blurRadius: 24,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Center(
                                  child: Container(
                                    width: 54,
                                    height: 54,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE8F0FB),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: const Icon(
                                      Icons.sms_outlined,
                                      color: AppColors.spfBlue,
                                      size: 26,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                Text(
                                  'Welcome back',
                                  textAlign: TextAlign.center,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.navy,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Enter your mobile number',
                                  textAlign: TextAlign.center,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleSmall
                                      ?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.spfBlue,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Use your registered mobile number to continue.',
                                  textAlign: TextAlign.center,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: AppColors.textSecondary,
                                        height: 1.4,
                                        fontSize: 13.5,
                                      ),
                                ),
                                const SizedBox(height: 22),
                                const Text(
                                  'Mobile number',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                    color: AppColors.navy,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                _PhoneField(
                                  controller: _phoneController,
                                  focusNode: _phoneFocus,
                                  enabled: !_sending,
                                  onSubmitted: (_) => _continue(),
                                ),
                                if (_error != null) ...[
                                  const SizedBox(height: 12),
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: AppColors.error
                                          .withValues(alpha: 0.08),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      _error!,
                                      style: const TextStyle(
                                        color: AppColors.error,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 18),
                                SizedBox(
                                  height: 52,
                                  child: FilledButton(
                                    onPressed: _sending ? null : _continue,
                                    style: FilledButton.styleFrom(
                                      backgroundColor: AppColors.spfBlue,
                                      foregroundColor: Colors.white,
                                      disabledBackgroundColor: AppColors.spfBlue
                                          .withValues(alpha: 0.55),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                    ),
                                    child: _sending
                                        ? const Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              SizedBox(
                                                width: 18,
                                                height: 18,
                                                child:
                                                    CircularProgressIndicator(
                                                  strokeWidth: 2.2,
                                                  color: Colors.white,
                                                ),
                                              ),
                                              SizedBox(width: 10),
                                              Text(
                                                'Sending OTP...',
                                                style: TextStyle(
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 15,
                                                ),
                                              ),
                                            ],
                                          )
                                        : const Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                'Send OTP',
                                                style: TextStyle(
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 15.5,
                                                ),
                                              ),
                                              SizedBox(width: 8),
                                              Icon(
                                                Icons.send_rounded,
                                                size: 18,
                                              ),
                                            ],
                                          ),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEAF2FB),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Row(
                                    children: [
                                      Icon(
                                        Icons.shield_outlined,
                                        size: 18,
                                        color: AppColors.spfBlue,
                                      ),
                                      SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          'Your security is our priority. Keep your information safe and secure.',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textSecondary,
                                            height: 1.35,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 18),
                          Row(
                            children: [
                              const Expanded(child: Divider()),
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 12),
                                child: Text(
                                  'OR',
                                  style: TextStyle(
                                    color: AppColors.textSecondary
                                        .withValues(alpha: 0.85),
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                              const Expanded(child: Divider()),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Material(
                            color: AppColors.white,
                            borderRadius: BorderRadius.circular(14),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(14),
                              onTap: _sending
                                  ? null
                                  : () {
                                      Navigator.pushNamed(
                                        context,
                                        AppRoutes.login,
                                      );
                                    },
                              child: Ink(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 14,
                                ),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(
                                      Icons.mail_outline_rounded,
                                      color: AppColors.spfBlue,
                                    ),
                                    SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'Sign in with email or password',
                                        style: TextStyle(
                                          color: AppColors.spfBlue,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                    Icon(
                                      Icons.chevron_right_rounded,
                                      color: AppColors.spfBlue,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 22),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.verified_user_outlined,
                                size: 16,
                                color: AppColors.spfBlue.withValues(alpha: 0.9),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Together for a safer community',
                                style: TextStyle(
                                  color: AppColors.spfBlue,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Secure Citizen Authentication',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PhoneField extends StatelessWidget {
  const _PhoneField({
    required this.controller,
    required this.focusNode,
    required this.enabled,
    required this.onSubmitted,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool enabled;
  final ValueChanged<String> onSubmitted;

  @override
  Widget build(BuildContext context) {
    return FormField<String>(
      validator: (_) => SomaliPhone.validationError(controller.text),
      builder: (field) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: field.hasError
                      ? AppColors.error
                      : AppColors.border,
                ),
              ),
              child: Row(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 12, right: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 22,
                          height: 16,
                          decoration: BoxDecoration(
                            color: const Color(0xFF4189DD),
                            borderRadius: BorderRadius.circular(3),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.star,
                            size: 10,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          '+252',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppColors.navy,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 28,
                    color: AppColors.border,
                  ),
                  Expanded(
                    child: TextField(
                      controller: controller,
                      focusNode: focusNode,
                      enabled: enabled,
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.done,
                      onChanged: field.didChange,
                      onSubmitted: onSubmitted,
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(
                          RegExp(r'[\d+\s-]'),
                        ),
                        LengthLimitingTextInputFormatter(15),
                      ],
                      decoration: const InputDecoration(
                        hintText: '61XXXXXXX',
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        prefixIcon: Icon(
                          Icons.phone_iphone_outlined,
                          color: AppColors.spfBlue,
                        ),
                        contentPadding: EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (field.hasError) ...[
              const SizedBox(height: 8),
              Text(
                field.errorText!,
                style: const TextStyle(
                  color: AppColors.error,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}
