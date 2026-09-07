import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'staff_providers.dart';
import 'staff_ui_theme.dart';

class StaffCenterPage extends ConsumerStatefulWidget {
  const StaffCenterPage({super.key});

  @override
  ConsumerState<StaffCenterPage> createState() => _StaffCenterPageState();
}

class _StaffCenterPageState extends ConsumerState<StaffCenterPage>
    with WidgetsBindingObserver {
  static const _lime = Color(0xFFDBFF4B);
  static const _ink = Color(0xFF171717);
  static const _refreshInterval = Duration(seconds: 5);
  Timer? _refreshTimer;
  bool _refreshInFlight = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refreshTimer = Timer.periodic(_refreshInterval, (_) => _refreshSummary());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _refreshSummary();
    }
  }

  Future<void> _refreshSummary() async {
    if (!mounted || _refreshInFlight) return;

    _refreshInFlight = true;
    try {
      ref.invalidate(staffCommerceSummaryProvider);
      await ref.read(staffCommerceSummaryProvider.future);
    } catch (_) {
      // Keep the last rendered state; the provider exposes retry/error UI
      // when the user explicitly refreshes.
    } finally {
      _refreshInFlight = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final summary = ref.watch(staffCommerceSummaryProvider);

    return StaffUiTheme(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Staff Center'),
          actions: <Widget>[
            IconButton(
              tooltip: 'Refresh',
              onPressed: _refreshSummary,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: summary.when(
          data: (data) => RefreshIndicator(
            onRefresh: _refreshSummary,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final wide = constraints.maxWidth >= 760;
                final contentWidth =
                    constraints.maxWidth >= 1120 ? 1040.0 : double.infinity;

                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.fromLTRB(
                    wide ? 28 : 16,
                    12,
                    wide ? 28 : 16,
                    28,
                  ),
                  children: <Widget>[
                    Align(
                      alignment: Alignment.topCenter,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(maxWidth: contentWidth),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: <Widget>[
                            _OverviewHero(
                              totalOrders: data.totalOrders,
                              readyToFulfill: data.readyToFulfill,
                              activeReturns: data.activeReturns,
                              lowStockVariants: data.lowStockVariants,
                            ),
                            const SizedBox(height: 24),
                            const _SectionHeader(
                              eyebrow: 'WORKSPACE',
                              title: 'Operations',
                              subtitle:
                                  'Jump straight into the work that needs attention.',
                            ),
                            const SizedBox(height: 12),
                            _ActionGrid(
                              columns: wide ? 5 : 1,
                              children: <Widget>[
                                _ActionCard(
                                  icon: Icons.local_shipping_outlined,
                                  title: 'Orders & fulfillment',
                                  subtitle:
                                      'Process, ship and deliver paid customer orders.',
                                  badge: data.readyToFulfill,
                                  badgeLabel: 'ready',
                                  onTap: () => context.push('/staff/orders'),
                                ),
                                _ActionCard(
                                  icon: Icons.assignment_return_outlined,
                                  title: 'Returns operations',
                                  subtitle:
                                      'Review, receive, inspect and complete returns.',
                                  badge: data.activeReturns,
                                  badgeLabel: 'active',
                                  onTap: () => context.push('/staff/returns'),
                                ),
                                _ActionCard(
                                  icon: Icons.category_outlined,
                                  title: 'Categories',
                                  subtitle:
                                      'Organize storefront categories and sort order.',
                                  badge: 0,
                                  badgeLabel: 'items',
                                  onTap: () =>
                                      context.push('/staff/categories'),
                                ),
                                _ActionCard(
                                  icon: Icons.local_offer_outlined,
                                  title: 'Promotions',
                                  subtitle:
                                      'Manage coupons and automatic discounts.',
                                  badge: 0,
                                  badgeLabel: 'rules',
                                  onTap: () =>
                                      context.push('/staff/promotions'),
                                ),
                                _ActionCard(
                                  icon: Icons.inventory_2_outlined,
                                  title: 'Catalog & inventory',
                                  subtitle:
                                      'Manage products, SKUs, media and stock.',
                                  badge: data.lowStockVariants,
                                  badgeLabel: 'low stock',
                                  onTap: () => context.push('/staff/catalog'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 26),
                            const _SectionHeader(
                              eyebrow: 'LIVE SNAPSHOT',
                              title: 'Commerce health',
                              subtitle:
                                  'A compact view of today\'s operational workload.',
                            ),
                            const SizedBox(height: 12),
                            _MetricsGrid(
                              columns: wide ? 4 : 2,
                              children: <Widget>[
                                _MetricCard(
                                  icon: Icons.receipt_long_outlined,
                                  label: 'Total orders',
                                  value: data.totalOrders,
                                ),
                                _MetricCard(
                                  icon: Icons.payments_outlined,
                                  label: 'Awaiting payment',
                                  value: data.awaitingPayment,
                                ),
                                _MetricCard(
                                  icon: Icons.local_shipping_outlined,
                                  label: 'Ready to fulfill',
                                  value: data.readyToFulfill,
                                  highlighted: data.readyToFulfill > 0,
                                ),
                                _MetricCard(
                                  icon: Icons.task_alt_rounded,
                                  label: 'Fulfilled',
                                  value: data.fulfilled,
                                ),
                                _MetricCard(
                                  icon: Icons.assignment_return_outlined,
                                  label: 'Active returns',
                                  value: data.activeReturns,
                                  highlighted: data.activeReturns > 0,
                                ),
                                _MetricCard(
                                  icon: Icons.currency_exchange_rounded,
                                  label: 'Refund processing',
                                  value: data.refundProcessing,
                                  highlighted: data.refundProcessing > 0,
                                ),
                                _MetricCard(
                                  icon: Icons.inventory_2_outlined,
                                  label: 'Low-stock variants',
                                  value: data.lowStockVariants,
                                  highlighted: data.lowStockVariants > 0,
                                ),
                              ],
                            ),
                            const SizedBox(height: 22),
                            _AttentionPanel(
                              readyToFulfill: data.readyToFulfill,
                              activeReturns: data.activeReturns,
                              refundProcessing: data.refundProcessing,
                              lowStockVariants: data.lowStockVariants,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stackTrace) => _StaffCenterError(
            onRetry: () => ref.invalidate(staffCommerceSummaryProvider),
          ),
        ),
      ),
    );
  }
}

class _OverviewHero extends StatelessWidget {
  const _OverviewHero({
    required this.totalOrders,
    required this.readyToFulfill,
    required this.activeReturns,
    required this.lowStockVariants,
  });

  final int totalOrders;
  final int readyToFulfill;
  final int activeReturns;
  final int lowStockVariants;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _StaffCenterPageState._ink,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _StaffCenterPageState._lime,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'STAFF COMMERCE',
                        style: TextStyle(
                          color: _StaffCenterPageState._ink,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Run the store\nfrom one place.',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                height: 1.05,
                              ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Orders, returns and inventory — organised around what needs action now.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.white70,
                            height: 1.45,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: _StaffCenterPageState._lime,
                  borderRadius: BorderRadius.circular(22),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.storefront_rounded,
                  size: 34,
                  color: _StaffCenterPageState._ink,
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: <Widget>[
              _HeroStat(label: 'Orders', value: totalOrders),
              _HeroStat(label: 'Ready', value: readyToFulfill),
              _HeroStat(label: 'Returns', value: activeReturns),
              _HeroStat(label: 'Low stock', value: lowStockVariants),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(
            value.toString(),
            style: const TextStyle(
              color: _StaffCenterPageState._lime,
              fontWeight: FontWeight.w900,
              fontSize: 16,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
  });

  final String eyebrow;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          eyebrow,
          style: const TextStyle(
            color: _StaffCenterPageState._ink,
            fontSize: 11,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),
        const SizedBox(height: 3),
        Text(
          subtitle,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            height: 1.35,
          ),
        ),
      ],
    );
  }
}

class _ActionGrid extends StatelessWidget {
  const _ActionGrid({required this.columns, required this.children});

  final int columns;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const spacing = 10.0;
        final width =
            (constraints.maxWidth - spacing * (columns - 1)) / columns;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: children
              .map((child) => SizedBox(width: width, child: child))
              .toList(growable: false),
        );
      },
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.badgeLabel,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final int badge;
  final String badgeLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE5E5DF)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _StaffCenterPageState._ink,
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        const Icon(Icons.arrow_forward_rounded, size: 18),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        height: 1.35,
                        fontSize: 12.5,
                      ),
                    ),
                    if (badge > 0) ...<Widget>[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: _StaffCenterPageState._lime,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '$badge $badgeLabel',
                          style: const TextStyle(
                            color: _StaffCenterPageState._ink,
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricsGrid extends StatelessWidget {
  const _MetricsGrid({required this.columns, required this.children});

  final int columns;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const spacing = 10.0;
        final width =
            (constraints.maxWidth - spacing * (columns - 1)) / columns;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: children
              .map((child) => SizedBox(width: width, child: child))
              .toList(growable: false),
        );
      },
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.label,
    required this.value,
    this.highlighted = false,
  });

  final IconData icon;
  final String label;
  final int value;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: highlighted ? _StaffCenterPageState._lime : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: highlighted
              ? _StaffCenterPageState._ink
              : const Color(0xFFE5E5DF),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, size: 20, color: _StaffCenterPageState._ink),
          const SizedBox(height: 14),
          Text(
            value.toString(),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: _StaffCenterPageState._ink,
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: _StaffCenterPageState._ink,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              height: 1.25,
            ),
          ),
        ],
      ),
    );
  }
}

class _AttentionPanel extends StatelessWidget {
  const _AttentionPanel({
    required this.readyToFulfill,
    required this.activeReturns,
    required this.refundProcessing,
    required this.lowStockVariants,
  });

  final int readyToFulfill;
  final int activeReturns;
  final int refundProcessing;
  final int lowStockVariants;

  @override
  Widget build(BuildContext context) {
    final attentionCount =
        readyToFulfill + activeReturns + refundProcessing + lowStockVariants;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F0EA),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0E0DA)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: attentionCount == 0
                  ? Colors.white
                  : _StaffCenterPageState._lime,
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Icon(
              attentionCount == 0
                  ? Icons.check_circle_outline_rounded
                  : Icons.bolt_rounded,
              color: _StaffCenterPageState._ink,
              size: 21,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  attentionCount == 0
                      ? 'Operations look clear'
                      : '$attentionCount operational signals',
                  style: const TextStyle(
                    color: _StaffCenterPageState._ink,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  attentionCount == 0
                      ? 'There are no fulfillment, return, refund or low-stock items requiring attention right now.'
                      : 'Prioritise fulfillment, returns, refund processing and low-stock items from the workspaces above.',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StaffCenterError extends StatelessWidget {
  const _StaffCenterError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(Icons.error_outline_rounded, size: 40),
            const SizedBox(height: 12),
            const Text(
              'Unable to load Staff Center.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
