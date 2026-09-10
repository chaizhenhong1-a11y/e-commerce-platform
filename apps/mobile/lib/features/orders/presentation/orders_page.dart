import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/domain/auth_state.dart';
import '../../auth/presentation/auth_providers.dart';
import '../domain/customer_order.dart';
import 'order_providers.dart';

const _elvaneBlack = Color(0xFF171717);
const _elvaneLime = Color(0xFFDBFF4B);
const _elvaneCanvas = Color(0xFFF6F6F3);
const _elvaneBorder = Color(0xFFE5E5DF);
const _elvaneMuted = Color(0xFF70706B);

class OrdersPage extends ConsumerStatefulWidget {
  const OrdersPage({super.key});

  @override
  ConsumerState<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends ConsumerState<OrdersPage>
    with WidgetsBindingObserver {
  Timer? _liveRefreshTimer;
  bool _refreshInFlight = false;
  String _filter = 'ALL';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _startLiveRefresh();
  }

  @override
  void dispose() {
    _liveRefreshTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startLiveRefresh();
      unawaited(_refreshOrders());
    } else if (state == AppLifecycleState.detached) {
      _liveRefreshTimer?.cancel();
      _liveRefreshTimer = null;
    }
  }

  void _startLiveRefresh() {
    if (_liveRefreshTimer?.isActive ?? false) {
      return;
    }
    _liveRefreshTimer = Timer.periodic(
      const Duration(seconds: 4),
      (_) => unawaited(_refreshOrders()),
    );
  }

  Future<void> _refreshOrders() async {
    if (!mounted || _refreshInFlight) {
      return;
    }
    final auth = ref.read(authControllerProvider);
    if (!auth.isAuthenticated) {
      return;
    }
    _refreshInFlight = true;
    try {
      await ref.refresh(customerOrdersProvider.future).then<void>((_) {});
    } catch (_) {
      // Keep the last successful list state visible and retry next interval.
    } finally {
      _refreshInFlight = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    if (auth.status == AuthStatus.checking) {
      return const Scaffold(
        backgroundColor: _elvaneCanvas,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!auth.isAuthenticated) {
      return Scaffold(
        backgroundColor: _elvaneCanvas,
        appBar: AppBar(title: const Text('Orders')),
        body: _SignedOutOrders(onSignIn: () => context.push('/sign-in')),
      );
    }

    final orders = ref.watch(customerOrdersProvider);
    return Scaffold(
      backgroundColor: _elvaneCanvas,
      appBar: AppBar(
        backgroundColor: _elvaneCanvas,
        surfaceTintColor: Colors.transparent,
        title: const Text('Orders'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Refresh',
            onPressed: _refreshOrders,
            icon: const Icon(Icons.refresh_rounded),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshOrders,
        child: orders.when(
          loading: () => const _OrdersLoading(),
          error: (error, stackTrace) => _OrdersError(
            message: error.toString(),
            onRetry: () => ref.invalidate(customerOrdersProvider),
          ),
          data: _buildOrders,
        ),
      ),
    );
  }

  Widget _buildOrders(List<CustomerOrder> items) {
    if (items.isEmpty) {
      return const _EmptyOrders();
    }

    final filtered = _filter == 'ALL'
        ? items
        : items.where((order) => _matchesFilter(order, _filter)).toList();
    final activeCount =
        items.where((order) => !_isTerminal(order.status)).length;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: <Widget>[
        _OrdersHero(totalOrders: items.length, activeOrders: activeCount),
        const SizedBox(height: 20),
        const _SectionHeader(
          eyebrow: 'YOUR PURCHASES',
          title: 'Order history',
          description: 'Track every order from payment to delivery.',
        ),
        const SizedBox(height: 14),
        _OrderFilters(
          selected: _filter,
          onSelected: (value) => setState(() => _filter = value),
        ),
        const SizedBox(height: 16),
        if (filtered.isEmpty)
          _FilteredEmpty(onReset: () => setState(() => _filter = 'ALL'))
        else
          ...filtered.map(
            (order) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _OrderCard(
                order: order,
                onTap: () => context.push('/orders/${order.orderNumber}'),
              ),
            ),
          ),
      ],
    );
  }

  static bool _matchesFilter(CustomerOrder order, String filter) {
    final status = order.status.toUpperCase();
    switch (filter) {
      case 'ACTIVE':
        return !_isTerminal(status);
      case 'SHIPPED':
        return status == 'SHIPPED';
      case 'DELIVERED':
        return status == 'DELIVERED' || status == 'FULFILLED';
      default:
        return true;
    }
  }

  static bool _isTerminal(String status) {
    final normalized = status.toUpperCase();
    return normalized == 'DELIVERED' ||
        normalized == 'FULFILLED' ||
        normalized == 'CANCELLED' ||
        normalized == 'CANCELED' ||
        normalized == 'REFUNDED';
  }
}

class _OrdersHero extends StatelessWidget {
  const _OrdersHero({required this.totalOrders, required this.activeOrders});

  final int totalOrders;
  final int activeOrders;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: _elvaneBlack,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(
                    color: _elvaneLime,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    'MY ELVANE',
                    style: TextStyle(
                      color: _elvaneBlack,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.1,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  '$totalOrders order${totalOrders == 1 ? '' : 's'} in your history',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    height: 1.15,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  activeOrders == 0
                      ? 'Everything is up to date.'
                      : '$activeOrders currently moving through fulfillment.',
                  style: const TextStyle(color: Color(0xFFBDBDB8), height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            width: 58,
            height: 58,
            decoration: const BoxDecoration(
              color: _elvaneLime,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.local_mall_outlined,
                color: _elvaneBlack, size: 28),
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
    required this.description,
  });

  final String eyebrow;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          eyebrow,
          style: const TextStyle(
            color: _elvaneMuted,
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.3,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          title,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: _elvaneBlack,
                fontWeight: FontWeight.w900,
              ),
        ),
        const SizedBox(height: 4),
        Text(description, style: const TextStyle(color: _elvaneMuted)),
      ],
    );
  }
}

class _OrderFilters extends StatelessWidget {
  const _OrderFilters({required this.selected, required this.onSelected});

  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    const filters = <(String, String)>[
      ('ALL', 'All'),
      ('ACTIVE', 'Active'),
      ('SHIPPED', 'Shipped'),
      ('DELIVERED', 'Delivered'),
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((entry) {
          final isSelected = selected == entry.$1;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(entry.$2),
              selected: isSelected,
              onSelected: (_) => onSelected(entry.$1),
              showCheckmark: false,
              backgroundColor: Colors.white,
              selectedColor: _elvaneBlack,
              side: const BorderSide(color: _elvaneBorder),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : _elvaneBlack,
                fontWeight: FontWeight.w800,
              ),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(999)),
            ),
          );
        }).toList(growable: false),
      ),
    );
  }
}

class _SignedOutOrders extends StatelessWidget {
  const _SignedOutOrders({required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              const _StateIcon(icon: Icons.receipt_long_outlined),
              const SizedBox(height: 20),
              Text(
                'Your orders live here',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: _elvaneBlack,
                    ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Sign in to follow payment, fulfillment, shipping and delivery from one place.',
                textAlign: TextAlign.center,
                style: TextStyle(color: _elvaneMuted, height: 1.45),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: _elvaneBlack,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                  ),
                  onPressed: onSignIn,
                  child: const Text('Sign in'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrdersLoading extends StatelessWidget {
  const _OrdersLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: <Widget>[
        Container(
          height: 158,
          decoration: BoxDecoration(
              color: _elvaneBlack, borderRadius: BorderRadius.circular(24)),
          child: const Center(
              child: CircularProgressIndicator(color: _elvaneLime)),
        ),
        const SizedBox(height: 20),
        ...List.generate(
          3,
          (_) => Container(
            height: 178,
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: _elvaneBorder),
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        ),
      ],
    );
  }
}

class _OrdersError extends StatelessWidget {
  const _OrdersError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(28),
      children: <Widget>[
        const SizedBox(height: 70),
        const _StateIcon(icon: Icons.cloud_off_outlined),
        const SizedBox(height: 20),
        Text(
          'Could not load orders',
          textAlign: TextAlign.center,
          style: Theme.of(context)
              .textTheme
              .headlineSmall
              ?.copyWith(fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 8),
        Text(message,
            textAlign: TextAlign.center,
            style: const TextStyle(color: _elvaneMuted)),
        const SizedBox(height: 20),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: _elvaneBlack),
          onPressed: onRetry,
          child: const Text('Try again'),
        ),
      ],
    );
  }
}

class _EmptyOrders extends StatelessWidget {
  const _EmptyOrders();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(28),
      children: <Widget>[
        const SizedBox(height: 70),
        const _StateIcon(icon: Icons.shopping_bag_outlined),
        const SizedBox(height: 20),
        Text(
          'No orders yet',
          textAlign: TextAlign.center,
          style: Theme.of(context)
              .textTheme
              .headlineSmall
              ?.copyWith(fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 8),
        const Text(
          'When you place your first Elvane order, its journey will appear here.',
          textAlign: TextAlign.center,
          style: TextStyle(color: _elvaneMuted, height: 1.45),
        ),
      ],
    );
  }
}

class _FilteredEmpty extends StatelessWidget {
  const _FilteredEmpty({required this.onReset});

  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: _elvaneBorder),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: <Widget>[
          const Icon(Icons.filter_alt_off_outlined, size: 34),
          const SizedBox(height: 10),
          const Text('No orders in this view',
              style: TextStyle(fontWeight: FontWeight.w900)),
          const SizedBox(height: 12),
          TextButton(onPressed: onReset, child: const Text('Show all orders')),
        ],
      ),
    );
  }
}

class _StateIcon extends StatelessWidget {
  const _StateIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 72,
        height: 72,
        decoration:
            const BoxDecoration(color: _elvaneLime, shape: BoxShape.circle),
        child: Icon(icon, color: _elvaneBlack, size: 34),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order, required this.onTap});

  final CustomerOrder order;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final progress = _fulfillmentProgress(order.status);
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            border: Border.all(color: _elvaneBorder),
            borderRadius: BorderRadius.circular(20),
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
                        const Text(
                          'ORDER',
                          style: TextStyle(
                            color: _elvaneMuted,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(order.orderNumber,
                            style: const TextStyle(
                                fontWeight: FontWeight.w900, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text(_formatDate(order.createdAt),
                            style: const TextStyle(
                                color: _elvaneMuted, fontSize: 12)),
                      ],
                    ),
                  ),
                  _StatusChip(status: order.status),
                ],
              ),
              const SizedBox(height: 16),
              if (progress != null) ...<Widget>[
                _DeliveryProgress(progress: progress),
                const SizedBox(height: 16),
              ],
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _elvaneCanvas,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: <Widget>[
                    ...order.items.take(3).map(
                          (item) => Padding(
                            padding: const EdgeInsets.only(bottom: 7),
                            child: Row(
                              children: <Widget>[
                                Expanded(
                                  child: Text(
                                    item.variantName == null
                                        ? item.productName
                                        : '${item.productName} · ${item.variantName}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text('×${item.quantity}',
                                    style: const TextStyle(
                                        color: _elvaneMuted,
                                        fontWeight: FontWeight.w800)),
                              ],
                            ),
                          ),
                        ),
                    if (order.items.length > 3)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          '+ ${order.items.length - 3} more item types',
                          style: const TextStyle(
                              color: _elvaneMuted, fontSize: 12),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: <Widget>[
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          '${order.itemCount} item${order.itemCount == 1 ? '' : 's'} · ${_pretty(order.paymentStatus)}',
                          style: const TextStyle(
                              color: _elvaneMuted,
                              fontSize: 12,
                              fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${order.currency == 'MYR' ? 'RM' : order.currency} ${order.total.toStringAsFixed(2)}',
                          style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 19,
                              color: _elvaneBlack),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 42,
                    height: 42,
                    decoration: const BoxDecoration(
                        color: _elvaneBlack, shape: BoxShape.circle),
                    child: const Icon(Icons.arrow_forward_rounded,
                        color: _elvaneLime),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _formatDate(DateTime value) {
    final day = value.day.toString().padLeft(2, '0');
    final month = value.month.toString().padLeft(2, '0');
    return '$day/$month/${value.year}';
  }

  static String _pretty(String value) =>
      value.replaceAll('_', ' ').toLowerCase().split(' ').map((word) {
        if (word.isEmpty) return word;
        return '${word[0].toUpperCase()}${word.substring(1)}';
      }).join(' ');

  static int? _fulfillmentProgress(String status) {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
      case 'FULFILLED':
        return 4;
      default:
        return null;
    }
  }
}

class _DeliveryProgress extends StatelessWidget {
  const _DeliveryProgress({required this.progress});

  final int progress;

  @override
  Widget build(BuildContext context) {
    const labels = <String>['Confirmed', 'Processing', 'Shipped', 'Delivered'];
    return Column(
      children: <Widget>[
        Row(
          children: List.generate(labels.length * 2 - 1, (index) {
            if (index.isOdd) {
              final step = (index + 1) ~/ 2;
              return Expanded(
                child: Container(
                    height: 2,
                    color: step < progress ? _elvaneBlack : _elvaneBorder),
              );
            }
            final step = index ~/ 2 + 1;
            final reached = step <= progress;
            return Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: reached ? _elvaneLime : Colors.white,
                shape: BoxShape.circle,
                border: Border.all(
                    color: reached ? _elvaneBlack : _elvaneBorder,
                    width: 2),
              ),
            );
          }),
        ),
        const SizedBox(height: 7),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: labels
              .map((label) => Text(label,
                  style: const TextStyle(
                      fontSize: 9,
                      color: _elvaneMuted,
                      fontWeight: FontWeight.w700)))
              .toList(growable: false),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final normalized = status.toUpperCase();
    final highlight = normalized == 'PROCESSING' || normalized == 'SHIPPED';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: highlight ? _elvaneLime : _elvaneBlack,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: highlight ? _elvaneBlack : Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}
