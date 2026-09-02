import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_providers.dart';
import 'auth_scaffold.dart';

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _submitting = false;
  String? _message;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _submitting) return;
    setState(() {
      _submitting = true;
      _message = null;
    });
    final error = await ref
        .read(authControllerProvider.notifier)
        .forgotPassword(_email.text);
    if (!mounted) return;
    setState(() {
      _submitting = false;
      _message = error ??
          'If an account exists for this email, password reset instructions have been requested.';
    });
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Reset password',
      subtitle:
          'Enter your account email. We will request a secure reset link.',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email address',
                prefixIcon: Icon(Icons.alternate_email_rounded),
              ),
              validator: (value) => value == null || !value.contains('@')
                  ? 'Enter a valid email.'
                  : null,
            ),
            if (_message != null) ...<Widget>[
              const SizedBox(height: 14),
              Text(_message!),
            ],
            const SizedBox(height: 18),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF171717),
                foregroundColor: const Color(0xFFDBFF4B),
                minimumSize: const Size.fromHeight(54),
              ),
              child: Text(_submitting ? 'Requesting…' : 'Request reset link'),
            ),
          ],
        ),
      ),
    );
  }
}
