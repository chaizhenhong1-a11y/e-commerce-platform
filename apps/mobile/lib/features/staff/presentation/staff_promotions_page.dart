import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/staff_promotion.dart';
import 'staff_providers.dart';
import 'staff_ui_theme.dart';

enum StaffPromotionsSection { coupons, automatic }

class StaffPromotionsPage extends ConsumerStatefulWidget {
  const StaffPromotionsPage({
    this.initialSection = StaffPromotionsSection.coupons,
    super.key,
  });

  final StaffPromotionsSection initialSection;

  @override
  ConsumerState<StaffPromotionsPage> createState() =>
      _StaffPromotionsPageState();
}

class _StaffPromotionsPageState extends ConsumerState<StaffPromotionsPage> {
  late StaffPromotionsSection _section;

  @override
  void initState() {
    super.initState();
    _section = widget.initialSection;
  }

  @override
  Widget build(BuildContext context) {
    return StaffUiTheme(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Promotions'),
          actions: <Widget>[
            IconButton(
              tooltip: 'Refresh',
              onPressed: _refresh,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _openEditor(context),
          backgroundColor: StaffUiTheme.brand,
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add_rounded),
          label: Text(
            _section == StaffPromotionsSection.coupons
                ? 'New coupon'
                : 'New automatic',
          ),
        ),
        body: Column(
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: SizedBox(
                width: double.infinity,
                child: SegmentedButton<StaffPromotionsSection>(
                  segments: const <ButtonSegment<StaffPromotionsSection>>[
                    ButtonSegment(
                      value: StaffPromotionsSection.coupons,
                      icon: Icon(Icons.confirmation_number_outlined),
                      label: Text('Coupons'),
                    ),
                    ButtonSegment(
                      value: StaffPromotionsSection.automatic,
                      icon: Icon(Icons.auto_awesome_outlined),
                      label: Text('Automatic'),
                    ),
                  ],
                  selected: <StaffPromotionsSection>{_section},
                  onSelectionChanged: (selection) {
                    setState(() => _section = selection.first);
                  },
                ),
              ),
            ),
            Expanded(
              child: _section == StaffPromotionsSection.coupons
                  ? const _CouponsView()
                  : const _AutomaticPromotionsView(),
            ),
          ],
        ),
      ),
    );
  }

  void _refresh() {
    ref.invalidate(staffPromotionEditorOptionsProvider);
    if (_section == StaffPromotionsSection.coupons) {
      ref.invalidate(staffCouponPromotionsProvider);
    } else {
      ref.invalidate(staffAutomaticPromotionsProvider);
    }
  }

  Future<void> _openEditor(BuildContext context) async {
    final changed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _PromotionEditor(section: _section),
    );
    if (changed == true) _refresh();
  }
}

class _CouponsView extends ConsumerWidget {
  const _CouponsView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final promotions = ref.watch(staffCouponPromotionsProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(staffCouponPromotionsProvider);
        await ref.read(staffCouponPromotionsProvider.future);
      },
      child: promotions.when(
        loading: () => const _ScrollableState(
          child: CircularProgressIndicator(),
        ),
        error: (_, __) => _LoadError(
          message: 'Could not load coupons.',
          onRetry: () => ref.invalidate(staffCouponPromotionsProvider),
        ),
        data: (items) => items.isEmpty
            ? const _ScrollableState(
                child: _EmptyState(
                  icon: Icons.confirmation_number_outlined,
                  title: 'No coupons yet.',
                  subtitle:
                      'Create a code-based promotion with schedule, usage and catalog rules.',
                ),
              )
            : ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 104),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) =>
                    _CouponCard(item: items[index]),
              ),
      ),
    );
  }
}

class _AutomaticPromotionsView extends ConsumerWidget {
  const _AutomaticPromotionsView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final promotions = ref.watch(staffAutomaticPromotionsProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(staffAutomaticPromotionsProvider);
        await ref.read(staffAutomaticPromotionsProvider.future);
      },
      child: promotions.when(
        loading: () => const _ScrollableState(
          child: CircularProgressIndicator(),
        ),
        error: (_, __) => _LoadError(
          message: 'Could not load automatic promotions.',
          onRetry: () => ref.invalidate(staffAutomaticPromotionsProvider),
        ),
        data: (items) => items.isEmpty
            ? const _ScrollableState(
                child: _EmptyState(
                  icon: Icons.auto_awesome_outlined,
                  title: 'No automatic discounts yet.',
                  subtitle:
                      'Eligible automatic promotions are evaluated server-side at checkout.',
                ),
              )
            : ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 104),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) =>
                    _AutomaticCard(item: items[index]),
              ),
      ),
    );
  }
}

class _CouponCard extends ConsumerWidget {
  const _CouponCard({required this.item});

  final StaffCouponPromotion item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _PromotionCardShell(
      icon: Icons.confirmation_number_outlined,
      active: item.isActive,
      title: item.name,
      headline: item.code,
      details: <String>[
        _discountLabel(item.discountType, item.value),
        'Min ${_money(item.minSubtotalCents)}',
        if (item.usageLimit != null)
          '${item.redemptionCount}/${item.usageLimit} uses'
        else
          '${item.redemptionCount} uses',
        _scopeLabel(item.productIds, item.categoryIds),
      ],
      onEdit: () => _openCouponEditor(context, ref, item),
      onDeactivate:
          item.isActive ? () => _deactivateCoupon(context, ref, item) : null,
    );
  }
}

class _AutomaticCard extends ConsumerWidget {
  const _AutomaticCard({required this.item});

  final StaffAutomaticPromotion item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _PromotionCardShell(
      icon: Icons.auto_awesome_outlined,
      active: item.isActive,
      title: item.name,
      headline: 'Priority ${item.priority}',
      details: <String>[
        _discountLabel(item.discountType, item.value),
        'Min ${_money(item.minSubtotalCents)}',
        _scopeLabel(item.productIds, item.categoryIds),
      ],
      onEdit: () => _openAutomaticEditor(context, ref, item),
      onDeactivate:
          item.isActive ? () => _deactivateAutomatic(context, ref, item) : null,
    );
  }
}

class _PromotionCardShell extends StatelessWidget {
  const _PromotionCardShell({
    required this.icon,
    required this.active,
    required this.title,
    required this.headline,
    required this.details,
    required this.onEdit,
    this.onDeactivate,
  });

  final IconData icon;
  final bool active;
  final String title;
  final String headline;
  final List<String> details;
  final VoidCallback onEdit;
  final VoidCallback? onDeactivate;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: StaffUiTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: active ? StaffUiTheme.accent : StaffUiTheme.canvas,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon),
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
                              fontSize: 16,
                            ),
                          ),
                        ),
                        _StatusPill(active: active),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      headline,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 7,
            runSpacing: 7,
            children: details
                .map((detail) => _InfoPill(label: detail))
                .toList(growable: false),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: <Widget>[
              OutlinedButton(
                onPressed: onEdit,
                child: const Text('Edit'),
              ),
              if (onDeactivate != null) ...<Widget>[
                const SizedBox(width: 8),
                TextButton(
                  onPressed: onDeactivate,
                  child: const Text('Deactivate'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _PromotionEditor extends ConsumerStatefulWidget {
  const _PromotionEditor({
    required this.section,
    this.coupon,
    this.automatic,
  });

  final StaffPromotionsSection section;
  final StaffCouponPromotion? coupon;
  final StaffAutomaticPromotion? automatic;

  @override
  ConsumerState<_PromotionEditor> createState() => _PromotionEditorState();
}

class _PromotionEditorState extends ConsumerState<_PromotionEditor> {
  late final TextEditingController _code;
  late final TextEditingController _name;
  late final TextEditingController _description;
  late final TextEditingController _value;
  late final TextEditingController _minSubtotal;
  late final TextEditingController _maxDiscount;
  late final TextEditingController _usageLimit;
  late final TextEditingController _perUserLimit;
  late final TextEditingController _priority;
  late StaffPromotionDiscountType _discountType;
  late bool _isActive;
  DateTime? _startsAt;
  DateTime? _endsAt;
  late Set<String> _productIds;
  late Set<String> _categoryIds;
  bool _saving = false;

  bool get _isCoupon => widget.section == StaffPromotionsSection.coupons;
  bool get _editing => widget.coupon != null || widget.automatic != null;

  @override
  void initState() {
    super.initState();
    final coupon = widget.coupon;
    final automatic = widget.automatic;
    final discountType = coupon?.discountType ??
        automatic?.discountType ??
        StaffPromotionDiscountType.percentage;
    final rawValue = coupon?.value ?? automatic?.value ?? 10;

    _code = TextEditingController(text: coupon?.code ?? '');
    _name = TextEditingController(text: coupon?.name ?? automatic?.name ?? '');
    _description = TextEditingController(
      text: coupon?.description ?? automatic?.description ?? '',
    );
    _discountType = discountType;
    _value = TextEditingController(
      text: discountType == StaffPromotionDiscountType.percentage
          ? rawValue.toString()
          : (rawValue / 100).toStringAsFixed(2),
    );
    _minSubtotal = TextEditingController(
      text:
          ((coupon?.minSubtotalCents ?? automatic?.minSubtotalCents ?? 0) / 100)
              .toStringAsFixed(2),
    );
    final maxDiscount = coupon?.maxDiscountCents ?? automatic?.maxDiscountCents;
    _maxDiscount = TextEditingController(
      text: maxDiscount == null ? '' : (maxDiscount / 100).toStringAsFixed(2),
    );
    _usageLimit = TextEditingController(
      text: coupon?.usageLimit?.toString() ?? '',
    );
    _perUserLimit = TextEditingController(
      text: coupon?.perUserLimit?.toString() ?? '',
    );
    _priority = TextEditingController(
      text: automatic?.priority.toString() ?? '0',
    );
    _isActive = coupon?.isActive ?? automatic?.isActive ?? true;
    _startsAt = coupon?.startsAt ?? automatic?.startsAt;
    _endsAt = coupon?.endsAt ?? automatic?.endsAt;
    _productIds =
        Set<String>.from(coupon?.productIds ?? automatic?.productIds ?? []);
    _categoryIds =
        Set<String>.from(coupon?.categoryIds ?? automatic?.categoryIds ?? []);
  }

  @override
  void dispose() {
    _code.dispose();
    _name.dispose();
    _description.dispose();
    _value.dispose();
    _minSubtotal.dispose();
    _maxDiscount.dispose();
    _usageLimit.dispose();
    _perUserLimit.dispose();
    _priority.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final options = ref.watch(staffPromotionEditorOptionsProvider);
    return StaffUiTheme(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          20 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: options.when(
          loading: () => const SizedBox(
            height: 280,
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, __) => SizedBox(
            height: 280,
            child: Center(
              child: OutlinedButton(
                onPressed: () =>
                    ref.invalidate(staffPromotionEditorOptionsProvider),
                child: const Text('Retry loading catalog options'),
              ),
            ),
          ),
          data: (editorOptions) => SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Text(
                  _editing
                      ? _isCoupon
                          ? 'Edit coupon'
                          : 'Edit automatic promotion'
                      : _isCoupon
                          ? 'New coupon'
                          : 'New automatic promotion',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  _isCoupon
                      ? 'Checkout recalculates coupon rules on the server.'
                      : 'The best eligible automatic discount is selected on the server.',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                if (_isCoupon) ...<Widget>[
                  TextField(
                    controller: _code,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(
                      labelText: 'Coupon code',
                      hintText: 'WELCOME10',
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                TextField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Name'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<StaffPromotionDiscountType>(
                  initialValue: _discountType,
                  decoration: const InputDecoration(labelText: 'Discount type'),
                  items: StaffPromotionDiscountType.values
                      .map(
                        (type) => DropdownMenuItem(
                          value: type,
                          child: Text(type.label),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: _saving
                      ? null
                      : (value) {
                          if (value != null) {
                            setState(() => _discountType = value);
                          }
                        },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _value,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText:
                        _discountType == StaffPromotionDiscountType.percentage
                            ? 'Percentage (%)'
                            : 'Amount (RM)',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _minSubtotal,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration:
                      const InputDecoration(labelText: 'Minimum subtotal (RM)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _maxDiscount,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Maximum discount (RM)',
                    hintText: 'Optional',
                  ),
                ),
                if (_isCoupon) ...<Widget>[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _usageLimit,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Total usage limit',
                      hintText: 'Unlimited',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _perUserLimit,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Per-account limit',
                      hintText: 'Unlimited',
                    ),
                  ),
                ] else ...<Widget>[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _priority,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Priority'),
                  ),
                ],
                const SizedBox(height: 12),
                _DateTimeField(
                  label: 'Starts at',
                  value: _startsAt,
                  onChanged: _saving
                      ? null
                      : (value) => setState(() => _startsAt = value),
                ),
                const SizedBox(height: 12),
                _DateTimeField(
                  label: 'Ends at',
                  value: _endsAt,
                  onChanged: _saving
                      ? null
                      : (value) => setState(() => _endsAt = value),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _description,
                  minLines: 2,
                  maxLines: 4,
                  maxLength: 500,
                  decoration: const InputDecoration(
                      labelText: 'Description (optional)'),
                ),
                SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Active'),
                  value: _isActive,
                  onChanged: _saving
                      ? null
                      : (value) => setState(() => _isActive = value),
                ),
                const SizedBox(height: 8),
                _ScopeSelector(
                  title: 'Categories',
                  options: editorOptions.categories,
                  selected: _categoryIds,
                  onChanged: (value) => setState(() => _categoryIds = value),
                ),
                const SizedBox(height: 14),
                _ScopeSelector(
                  title: 'Products',
                  options: editorOptions.products,
                  selected: _productIds,
                  onChanged: (value) => setState(() => _productIds = value),
                ),
                const SizedBox(height: 8),
                Text(
                  _productIds.isEmpty && _categoryIds.isEmpty
                      ? 'Scope: Entire catalog'
                      : 'Scope: ${_productIds.length} products + ${_categoryIds.length} categories',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: _saving
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save_outlined),
                  label: Text(_saving ? 'Saving…' : 'Save promotion'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    final name = _name.text.trim();
    final percentageOrAmount = double.tryParse(_value.text.trim());
    final minSubtotal = double.tryParse(_minSubtotal.text.trim());
    final maxDiscount = _maxDiscount.text.trim().isEmpty
        ? null
        : double.tryParse(_maxDiscount.text.trim());
    final usageLimit = _usageLimit.text.trim().isEmpty
        ? null
        : int.tryParse(_usageLimit.text.trim());
    final perUserLimit = _perUserLimit.text.trim().isEmpty
        ? null
        : int.tryParse(_perUserLimit.text.trim());
    final priority = int.tryParse(_priority.text.trim());

    if (name.isEmpty ||
        percentageOrAmount == null ||
        percentageOrAmount <= 0 ||
        minSubtotal == null ||
        minSubtotal < 0 ||
        (_maxDiscount.text.trim().isNotEmpty && maxDiscount == null) ||
        (_isCoupon && _code.text.trim().isEmpty) ||
        (_isCoupon &&
            _usageLimit.text.trim().isNotEmpty &&
            usageLimit == null) ||
        (_isCoupon &&
            _perUserLimit.text.trim().isNotEmpty &&
            perUserLimit == null) ||
        (!_isCoupon && priority == null)) {
      _showMessage('Check the required promotion values.');
      return;
    }

    if (_discountType == StaffPromotionDiscountType.percentage &&
        percentageOrAmount > 100) {
      _showMessage('Percentage discount cannot exceed 100%.');
      return;
    }
    if (_endsAt != null && _startsAt != null && !_endsAt!.isAfter(_startsAt!)) {
      _showMessage('End time must be after start time.');
      return;
    }

    final value = _discountType == StaffPromotionDiscountType.percentage
        ? percentageOrAmount.round()
        : (percentageOrAmount * 100).round();
    final minSubtotalCents = (minSubtotal * 100).round();
    final maxDiscountCents =
        maxDiscount == null ? null : (maxDiscount * 100).round();

    setState(() => _saving = true);
    try {
      final repository = ref.read(staffRepositoryProvider);
      if (_isCoupon) {
        final coupon = widget.coupon;
        if (coupon == null) {
          await repository.createCouponPromotion(
            code: _code.text,
            name: name,
            description: _description.text,
            discountType: _discountType,
            value: value,
            minSubtotalCents: minSubtotalCents,
            maxDiscountCents: maxDiscountCents,
            startsAt: _startsAt,
            endsAt: _endsAt,
            usageLimit: usageLimit,
            perUserLimit: perUserLimit,
            isActive: _isActive,
            productIds: _productIds.toList(growable: false),
            categoryIds: _categoryIds.toList(growable: false),
          );
        } else {
          await repository.updateCouponPromotion(
            promotionId: coupon.id,
            code: _code.text,
            name: name,
            description: _description.text,
            discountType: _discountType,
            value: value,
            minSubtotalCents: minSubtotalCents,
            maxDiscountCents: maxDiscountCents,
            startsAt: _startsAt,
            endsAt: _endsAt,
            usageLimit: usageLimit,
            perUserLimit: perUserLimit,
            isActive: _isActive,
            productIds: _productIds.toList(growable: false),
            categoryIds: _categoryIds.toList(growable: false),
          );
        }
      } else {
        final automatic = widget.automatic;
        if (automatic == null) {
          await repository.createAutomaticPromotion(
            name: name,
            description: _description.text,
            discountType: _discountType,
            value: value,
            minSubtotalCents: minSubtotalCents,
            maxDiscountCents: maxDiscountCents,
            startsAt: _startsAt,
            endsAt: _endsAt,
            priority: priority!,
            isActive: _isActive,
            productIds: _productIds.toList(growable: false),
            categoryIds: _categoryIds.toList(growable: false),
          );
        } else {
          await repository.updateAutomaticPromotion(
            promotionId: automatic.id,
            name: name,
            description: _description.text,
            discountType: _discountType,
            value: value,
            minSubtotalCents: minSubtotalCents,
            maxDiscountCents: maxDiscountCents,
            startsAt: _startsAt,
            endsAt: _endsAt,
            priority: priority!,
            isActive: _isActive,
            productIds: _productIds.toList(growable: false),
            categoryIds: _categoryIds.toList(growable: false),
          );
        }
      }
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        setState(() => _saving = false);
        _showApiError(context, error);
      }
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _ScopeSelector extends StatelessWidget {
  const _ScopeSelector({
    required this.title,
    required this.options,
    required this.selected,
    required this.onChanged,
  });

  final String title;
  final List<StaffPromotionCatalogOption> options;
  final Set<String> selected;
  final ValueChanged<Set<String>> onChanged;

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      tilePadding: EdgeInsets.zero,
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w800),
      ),
      subtitle: Text(
        selected.isEmpty ? 'All' : '${selected.length} selected',
      ),
      children: options
          .map(
            (option) => CheckboxListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              title: Text(option.name),
              value: selected.contains(option.id),
              onChanged: (checked) {
                final next = Set<String>.from(selected);
                if (checked == true) {
                  next.add(option.id);
                } else {
                  next.remove(option.id);
                }
                onChanged(next);
              },
            ),
          )
          .toList(growable: false),
    );
  }
}

class _DateTimeField extends StatelessWidget {
  const _DateTimeField({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final DateTime? value;
  final ValueChanged<DateTime?>? onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onChanged == null ? null : () => _pick(context),
      borderRadius: BorderRadius.circular(14),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: value == null
              ? const Icon(Icons.event_outlined)
              : IconButton(
                  tooltip: 'Clear',
                  onPressed: onChanged == null ? null : () => onChanged!(null),
                  icon: const Icon(Icons.close_rounded),
                ),
        ),
        child: Text(value == null ? 'Not set' : _formatDateTime(value!)),
      ),
    );
  }

  Future<void> _pick(BuildContext context) async {
    final now = DateTime.now();
    final initial = value ?? now;
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 10),
    );
    if (date == null || !context.mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return;
    onChanged?.call(
      DateTime(date.year, date.month, date.day, time.hour, time.minute),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: active ? StaffUiTheme.accent : StaffUiTheme.canvas,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: StaffUiTheme.border),
      ),
      child: Text(
        active ? 'ACTIVE' : 'INACTIVE',
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: StaffUiTheme.canvas,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: StaffUiTheme.border),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Icon(icon, size: 42),
        const SizedBox(height: 12),
        Text(title, style: const TextStyle(fontWeight: FontWeight.w900)),
        const SizedBox(height: 6),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return _ScrollableState(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(Icons.error_outline_rounded, size: 36),
          const SizedBox(height: 12),
          Text(message),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: onRetry, child: const Text('Try again')),
        ],
      ),
    );
  }
}

class _ScrollableState extends StatelessWidget {
  const _ScrollableState({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: <Widget>[
          SizedBox(
            height: constraints.maxHeight > 48 ? constraints.maxHeight - 48 : 0,
            child: Center(child: child),
          ),
        ],
      ),
    );
  }
}

Future<void> _openCouponEditor(
  BuildContext context,
  WidgetRef ref,
  StaffCouponPromotion item,
) async {
  final changed = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => _PromotionEditor(
      section: StaffPromotionsSection.coupons,
      coupon: item,
    ),
  );
  if (changed == true) ref.invalidate(staffCouponPromotionsProvider);
}

Future<void> _openAutomaticEditor(
  BuildContext context,
  WidgetRef ref,
  StaffAutomaticPromotion item,
) async {
  final changed = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => _PromotionEditor(
      section: StaffPromotionsSection.automatic,
      automatic: item,
    ),
  );
  if (changed == true) ref.invalidate(staffAutomaticPromotionsProvider);
}

Future<void> _deactivateCoupon(
  BuildContext context,
  WidgetRef ref,
  StaffCouponPromotion item,
) async {
  final confirmed = await _confirmDeactivate(
    context,
    'Deactivate “${item.code}”? Existing order snapshots are preserved.',
  );
  if (confirmed != true || !context.mounted) return;
  try {
    await ref.read(staffRepositoryProvider).deactivateCouponPromotion(item.id);
    ref.invalidate(staffCouponPromotionsProvider);
  } catch (error) {
    if (context.mounted) _showApiError(context, error);
  }
}

Future<void> _deactivateAutomatic(
  BuildContext context,
  WidgetRef ref,
  StaffAutomaticPromotion item,
) async {
  final confirmed = await _confirmDeactivate(
    context,
    'Deactivate “${item.name}”?',
  );
  if (confirmed != true || !context.mounted) return;
  try {
    await ref
        .read(staffRepositoryProvider)
        .deactivateAutomaticPromotion(item.id);
    ref.invalidate(staffAutomaticPromotionsProvider);
  } catch (error) {
    if (context.mounted) _showApiError(context, error);
  }
}

Future<bool?> _confirmDeactivate(BuildContext context, String message) {
  return showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Deactivate promotion?'),
      content: Text(message),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, true),
          child: const Text('Deactivate'),
        ),
      ],
    ),
  );
}

String _discountLabel(StaffPromotionDiscountType type, int value) {
  return type == StaffPromotionDiscountType.percentage
      ? '$value% off'
      : '${_money(value)} off';
}

String _money(int cents) => 'RM ${(cents / 100).toStringAsFixed(2)}';

String _scopeLabel(List<String> productIds, List<String> categoryIds) {
  if (productIds.isEmpty && categoryIds.isEmpty) return 'All products';
  final parts = <String>[];
  if (productIds.isNotEmpty) parts.add('${productIds.length} products');
  if (categoryIds.isNotEmpty) parts.add('${categoryIds.length} categories');
  return parts.join(' + ');
}

String _formatDateTime(DateTime value) {
  String two(int number) => number.toString().padLeft(2, '0');
  return '${value.year}-${two(value.month)}-${two(value.day)} '
      '${two(value.hour)}:${two(value.minute)}';
}

void _showApiError(BuildContext context, Object error) {
  var message = 'Something went wrong. Please try again.';
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final apiMessage = data['message'];
      if (apiMessage is String && apiMessage.trim().isNotEmpty) {
        message = apiMessage;
      } else if (apiMessage is List && apiMessage.isNotEmpty) {
        message = apiMessage.first.toString();
      }
    }
  }
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}
