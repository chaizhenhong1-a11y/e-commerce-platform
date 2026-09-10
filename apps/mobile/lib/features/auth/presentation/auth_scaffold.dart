import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    required this.title,
    required this.subtitle,
    required this.child,
    this.eyebrow = 'ELVANE ACCOUNT',
    super.key,
  });

  final String title;
  final String subtitle;
  final String eyebrow;
  final Widget child;

  static const _ink = Color(0xFF171717);
  static const _lime = Color(0xFFDBFF4B);
  static const _canvas = Color(0xFFF6F6F3);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _canvas,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth >= 860;
            if (wide) {
              return Row(
                children: <Widget>[
                  Expanded(
                      flex: 5,
                      child: _BrandPanel(onBack: () => _back(context))),
                  Expanded(
                    flex: 6,
                    child: _FormPanel(
                      eyebrow: eyebrow,
                      title: title,
                      subtitle: subtitle,
                      child: child,
                    ),
                  ),
                ],
              );
            }

            return ListView(
              padding: EdgeInsets.zero,
              children: <Widget>[
                _MobileBrandHeader(onBack: () => _back(context)),
                _FormPanel(
                  eyebrow: eyebrow,
                  title: title,
                  subtitle: subtitle,
                  compact: true,
                  child: child,
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  void _back(BuildContext context) {
    final navigator = Navigator.of(context);
    if (navigator.canPop()) {
      navigator.pop();
      return;
    }

    context.go('/');
  }
}

class _BrandPanel extends StatelessWidget {
  const _BrandPanel({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AuthScaffold._ink,
      child: Stack(
        children: <Widget>[
          Positioned(
            right: -120,
            bottom: -100,
            child: Container(
              width: 360,
              height: 360,
              decoration: const BoxDecoration(
                color: AuthScaffold._lime,
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            right: 76,
            bottom: 178,
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 2),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                IconButton.filledTonal(
                  onPressed: onBack,
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white.withValues(alpha: 0.10),
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: AuthScaffold._lime,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    'ELVANE',
                    style: TextStyle(
                      color: AuthScaffold._ink,
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.4,
                    ),
                  ),
                ),
                const SizedBox(height: 22),
                const Text(
                  'Your account.\nYour shop.\nEverywhere.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 42,
                    height: 1.02,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1.6,
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  'One account keeps your cart, wishlist, orders and delivery details together.',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.66),
                    fontSize: 15,
                    height: 1.55,
                  ),
                ),
                const Spacer(),
                const Row(
                  children: <Widget>[
                    Icon(Icons.lock_outline_rounded,
                        color: AuthScaffold._lime, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'SECURE CUSTOMER ACCESS',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.1,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MobileBrandHeader extends StatelessWidget {
  const _MobileBrandHeader({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 115,
      color: AuthScaffold._ink,
      padding: const EdgeInsets.fromLTRB(18, 16, 24, 22),
      child: Stack(
        children: <Widget>[
          Positioned(
            right: -42,
            bottom: -70,
            child: Container(
              width: 160,
              height: 160,
              decoration: const BoxDecoration(
                color: AuthScaffold._lime,
                shape: BoxShape.circle,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              IconButton(
                onPressed: onBack,
                color: Colors.white,
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              const Spacer(),
              const Padding(
                padding: EdgeInsets.only(left: 8),
                child: Text(
                  'ELVANE',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FormPanel extends StatelessWidget {
  const _FormPanel({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    required this.child,
    this.compact = false,
  });

  final String eyebrow;
  final String title;
  final String subtitle;
  final Widget child;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: compact ? Alignment.topCenter : Alignment.center,
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          compact ? 24 : 56,
          compact ? 34 : 48,
          compact ? 24 : 56,
          42,
        ),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                eyebrow,
                style: const TextStyle(
                  color: Color(0xFF6A6A64),
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      color: AuthScaffold._ink,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -1.5,
                      height: 1.02,
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: const Color(0xFF6A6A64),
                      height: 1.5,
                    ),
              ),
              const SizedBox(height: 30),
              child,
            ],
          ),
        ),
      ),
    );
  }
}
