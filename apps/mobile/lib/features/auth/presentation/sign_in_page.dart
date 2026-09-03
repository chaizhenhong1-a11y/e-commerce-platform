import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'auth_providers.dart';
import 'auth_scaffold.dart';

class SignInPage extends ConsumerStatefulWidget {
  const SignInPage({this.returnTo, super.key});

  final String? returnTo;

  @override
  ConsumerState<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends ConsumerState<SignInPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String get _safeReturnTo {
    final target = widget.returnTo;
    if (target == null ||
        !target.startsWith('/') ||
        target.startsWith('/sign-in') ||
        target.startsWith('/register') ||
        target.startsWith('/forgot-password')) {
      return '/profile';
    }
    return target;
  }

  String _registerLocation() {
    return Uri(
      path: '/register',
      queryParameters: <String, String>{'returnTo': _safeReturnTo},
    ).toString();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final success = await ref.read(authControllerProvider.notifier).login(
          email: _emailController.text,
          password: _passwordController.text,
        );
    if (success && mounted) {
      context.go(_safeReturnTo);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    return AuthScaffold(
      title: 'Welcome back',
      subtitle: 'Sign in to see your orders, profile, and saved addresses.',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const <String>[AutofillHints.email],
              decoration: const InputDecoration(
                labelText: 'Email address',
                prefixIcon: Icon(Icons.alternate_email_rounded),
              ),
              validator: (value) => value == null || !value.contains('@')
                  ? 'Enter a valid email.'
                  : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _passwordController,
              obscureText: true,
              autofillHints: const <String>[AutofillHints.password],
              decoration: const InputDecoration(
                labelText: 'Password',
                prefixIcon: Icon(Icons.lock_outline_rounded),
              ),
              validator: (value) => value == null || value.isEmpty
                  ? 'Enter your password.'
                  : null,
              onFieldSubmitted: (_) => _submit(),
            ),
            if (auth.message != null) ...<Widget>[
              const SizedBox(height: 14),
              Text(
                auth.message!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
            const SizedBox(height: 18),
            FilledButton(
              onPressed: auth.isSubmitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF171717),
                foregroundColor: const Color(0xFFDBFF4B),
                minimumSize: const Size.fromHeight(54),
              ),
              child: Text(auth.isSubmitting ? 'Signing in…' : 'Sign in'),
            ),
            const SizedBox(height: 12),
            TextButton(
              style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF171717)),
              onPressed: () => context.push('/forgot-password'),
              child: const Text('Forgot password?'),
            ),
            const Divider(height: 28),
            TextButton(
              style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF171717)),
              onPressed: () => context.push(_registerLocation()),
              child: const Text('Create a TextShop account'),
            ),
          ],
        ),
      ),
    );
  }
}
