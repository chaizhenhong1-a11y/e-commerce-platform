import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'staff_providers.dart';

class StaffCenterPage extends ConsumerWidget {
  const StaffCenterPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(staffCommerceSummaryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff Center'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => ref.invalidate(staffCommerceSummaryProvider),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: summary.when(
        data: (data) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(staffCommerceSummaryProvider);
            await ref.read(staffCommerceSummaryProvider.future);
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            children: <Widget>[
              Text(
                'Commerce overview',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 6),
              Text(
                'A live operational snapshot from the existing staff API.',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 20),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.local_shipping_outlined),
                  title: const Text('Orders & fulfillment'),
                  subtitle: const Text(
                    'Process, ship and deliver paid customer orders',
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => context.push('/staff/orders'),
                ),
              ),
              const SizedBox(height: 10),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.assignment_return_outlined),
                  title: const Text('Returns operations'),
                  subtitle: const Text(
                    'Approve, receive, inspect and complete returns',
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => context.push('/staff/returns'),
                ),
              ),
              const SizedBox(height: 10),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.inventory_2_outlined),
                  title: const Text('Catalog & inventory'),
                  subtitle: const Text(
                    'Review products, SKU stock and audited adjustments',
                  ),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => context.push('/staff/catalog'),
                ),
              ),
              const SizedBox(height: 10),
              _SummaryTile(
                icon: Icons.receipt_long_outlined,
                label: 'Total orders',
                value: data.totalOrders,
              ),
              _SummaryTile(
                icon: Icons.payments_outlined,
                label: 'Awaiting payment',
                value: data.awaitingPayment,
              ),
              _SummaryTile(
                icon: Icons.local_shipping_outlined,
                label: 'Ready to fulfill',
                value: data.readyToFulfill,
              ),
              _SummaryTile(
                icon: Icons.task_alt_rounded,
                label: 'Fulfilled',
                value: data.fulfilled,
              ),
              _SummaryTile(
                icon: Icons.assignment_return_outlined,
                label: 'Active returns',
                value: data.activeReturns,
              ),
              _SummaryTile(
                icon: Icons.currency_exchange_rounded,
                label: 'Refund processing',
                value: data.refundProcessing,
              ),
              _SummaryTile(
                icon: Icons.inventory_2_outlined,
                label: 'Low-stock variants',
                value: data.lowStockVariants,
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const Icon(Icons.info_outline_rounded),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'This phase establishes the protected mobile Staff Center and live operational summary. Order processing and shipping actions remain in the existing staff web console until the next increment.',
                          style: TextStyle(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => _StaffCenterError(
          onRetry: () => ref.invalidate(staffCommerceSummaryProvider),
        ),
      ),
    );
  }
}

class _SummaryTile extends StatelessWidget {
  const _SummaryTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Icon(icon),
        title: Text(label),
        trailing: Text(
          value.toString(),
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),
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
            FilledButton.tonal(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
