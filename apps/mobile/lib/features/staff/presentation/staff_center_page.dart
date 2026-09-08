import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'staff_providers.dart';
import 'staff_store_settings_page.dart';
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
      // Keep current content and let the provider expose retry state.
    } finally {
      _refreshInFlight = false;
    }
  }

  String _money(String currency, int cents) {
    final value = cents / 100;
    return '$currency ${value.toStringAsFixed(2)}';
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
                final columns = wide ? 3 : 2;

                return ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.fromLTRB(
                    wide ? 28 : 16,
                    12,
                    wide ? 28 : 16,
                    28,
                  ),
                  children: <Widget>[
                    _Hero(
                      todayNetSales:
                          _money(data.currency, data.todayNetSalesCents),
                      todayOrders: data.todayOrders,
                      readyToFulfill: data.readyToFulfill,
                    ),
                    const SizedBox(height: 22),
                    const _SectionTitle(
                      eyebrow: 'SALES',
                      title: 'Owner snapshot',
                      subtitle: 'Real order and refund totals from PostgreSQL.',
                    ),
                    const SizedBox(height: 10),
                    _Grid(
                      columns: columns,
                      children: <Widget>[
                        _Metric(
                          label: 'Today net sales',
                          value: _money(data.currency, data.todayNetSalesCents),
                          icon: Icons.payments_outlined,
                          highlighted: true,
                        ),
                        _Metric(
                          label: 'Today orders',
                          value: '${data.todayOrders}',
                          icon: Icons.receipt_long_outlined,
                        ),
                        _Metric(
                          label: 'Today refunds',
                          value: _money(data.currency, data.todayRefundsCents),
                          icon: Icons.currency_exchange_rounded,
                        ),
                        _Metric(
                          label: 'Month net sales',
                          value: _money(data.currency, data.monthNetSalesCents),
                          icon: Icons.trending_up_rounded,
                        ),
                        _Metric(
                          label: 'Month gross sales',
                          value:
                              _money(data.currency, data.monthGrossSalesCents),
                          icon: Icons.account_balance_wallet_outlined,
                        ),
                        _Metric(
                          label: 'Average order value',
                          value: _money(
                            data.currency,
                            data.averageOrderValueCents,
                          ),
                          icon: Icons.analytics_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const _SectionTitle(
                      eyebrow: 'WORKSPACE',
                      title: 'Operations',
                      subtitle:
                          'Manage the store without leaving the Staff Center.',
                    ),
                    const SizedBox(height: 10),
                    _Grid(
                      columns: wide ? 3 : 1,
                      children: <Widget>[
                        _Action(
                          icon: Icons.local_shipping_outlined,
                          title: 'Orders & fulfillment',
                          subtitle: 'Process, ship and deliver paid orders.',
                          badge: data.readyToFulfill,
                          onTap: () => context.push('/staff/orders'),
                        ),
                        _Action(
                          icon: Icons.assignment_return_outlined,
                          title: 'Returns operations',
                          subtitle: 'Review, inspect and complete returns.',
                          badge: data.activeReturns,
                          onTap: () => context.push('/staff/returns'),
                        ),
                        _Action(
                          icon: Icons.inventory_2_outlined,
                          title: 'Catalog & inventory',
                          subtitle: 'Manage products, SKUs, media and stock.',
                          badge: data.lowStockVariants,
                          onTap: () => context.push('/staff/catalog'),
                        ),
                        _Action(
                          icon: Icons.category_outlined,
                          title: 'Categories',
                          subtitle: 'Organize storefront categories.',
                          onTap: () => context.push('/staff/categories'),
                        ),
                        _Action(
                          icon: Icons.local_offer_outlined,
                          title: 'Promotions',
                          subtitle: 'Manage coupons and automatic discounts.',
                          onTap: () => context.push('/staff/promotions'),
                        ),
                        _Action(
                          icon: Icons.settings_outlined,
                          title: 'Store settings',
                          subtitle:
                              'Brand, contact, currency, timezone and shipping.',
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const StaffStoreSettingsPage(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const _SectionTitle(
                      eyebrow: 'OPERATIONS',
                      title: 'Commerce health',
                      subtitle:
                          'Current workload that may need your attention.',
                    ),
                    const SizedBox(height: 10),
                    _Grid(
                      columns: columns,
                      children: <Widget>[
                        _Metric(
                          label: 'Total orders',
                          value: '${data.totalOrders}',
                          icon: Icons.receipt_long_outlined,
                        ),
                        _Metric(
                          label: 'Awaiting payment',
                          value: '${data.awaitingPayment}',
                          icon: Icons.hourglass_bottom_rounded,
                        ),
                        _Metric(
                          label: 'Ready to fulfill',
                          value: '${data.readyToFulfill}',
                          icon: Icons.local_shipping_outlined,
                          highlighted: data.readyToFulfill > 0,
                        ),
                        _Metric(
                          label: 'Active returns',
                          value: '${data.activeReturns}',
                          icon: Icons.assignment_return_outlined,
                          highlighted: data.activeReturns > 0,
                        ),
                        _Metric(
                          label: 'Refund processing',
                          value: '${data.refundProcessing}',
                          icon: Icons.currency_exchange_rounded,
                          highlighted: data.refundProcessing > 0,
                        ),
                        _Metric(
                          label: 'Low-stock variants',
                          value: '${data.lowStockVariants}',
                          icon: Icons.inventory_2_outlined,
                          highlighted: data.lowStockVariants > 0,
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => Center(
            child: FilledButton(
              onPressed: () => ref.invalidate(staffCommerceSummaryProvider),
              child: const Text('Retry Staff Center'),
            ),
          ),
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({
    required this.todayNetSales,
    required this.todayOrders,
    required this.readyToFulfill,
  });

  final String todayNetSales;
  final int todayOrders;
  final int readyToFulfill;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _StaffCenterPageState._ink,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const Text(
                  'TEXTSHOP OWNER',
                  style: TextStyle(
                    color: _StaffCenterPageState._lime,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  todayNetSales,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                ),
                const SizedBox(height: 5),
                Text(
                  '$todayOrders paid orders today · $readyToFulfill ready to fulfill',
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: _StaffCenterPageState._lime,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.storefront_rounded,
              color: _StaffCenterPageState._ink,
              size: 30,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
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
          ),
        ),
      ],
    );
  }
}

class _Grid extends StatelessWidget {
  const _Grid({required this.columns, required this.children});

  final int columns;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const gap = 10.0;
        final width = (constraints.maxWidth - gap * (columns - 1)) / columns;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: children
              .map((child) => SizedBox(width: width, child: child))
              .toList(growable: false),
        );
      },
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({
    required this.label,
    required this.value,
    required this.icon,
    this.highlighted = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: highlighted ? _StaffCenterPageState._lime : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE5E5DF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, size: 20),
          const SizedBox(height: 13),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
          ),
          const SizedBox(height: 5),
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.badge = 0,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final int badge;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: Row(
            children: <Widget>[
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _StaffCenterPageState._ink,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: Colors.white, size: 21),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (badge > 0)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    color: _StaffCenterPageState._lime,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '$badge',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                )
              else
                const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ),
      ),
    );
  }
}
