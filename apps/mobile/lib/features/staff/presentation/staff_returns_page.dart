import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/staff_repository.dart';
import '../domain/staff_return_case.dart';
import 'staff_providers.dart';

class StaffReturnsPage extends ConsumerStatefulWidget {
  const StaffReturnsPage({super.key});

  @override
  ConsumerState<StaffReturnsPage> createState() => _StaffReturnsPageState();
}

class _StaffReturnsPageState extends ConsumerState<StaffReturnsPage> {
  static const _statuses = <String>[
    'ALL',
    'REQUESTED',
    'APPROVED',
    'IN_TRANSIT',
    'RECEIVED',
    'COMPLETED',
    'REJECTED',
    'CANCELLED',
  ];
  static const _conditions = <String>[
    'UNOPENED',
    'OPENED',
    'DAMAGED',
    'DEFECTIVE',
  ];
  static const _dispositions = <String>[
    'RESTOCK',
    'QUARANTINE',
    'DISCARD',
  ];

  List<StaffReturnCase> _cases = const <StaffReturnCase>[];
  String _status = 'ALL';
  String? _busyId;
  String? _error;
  bool _loading = true;

  StaffRepository get _repository => ref.read(staffRepositoryProvider);

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_load);
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final cases = await _repository.getReturns(status: _status);
      if (!mounted) return;
      setState(() => _cases = cases);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Unable to load return cases.'));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  String _message(Object error, String fallback) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        final message = data['message'];
        if (message is String && message.trim().isNotEmpty) {
          return message.trim();
        }
        if (message is List && message.isNotEmpty) {
          return message.first.toString();
        }
      }
    }
    return fallback;
  }

  String _money(int cents, String currency) {
    return '$currency ${(cents / 100).toStringAsFixed(2)}';
  }

  String _date(DateTime? value) {
    if (value == null) return '—';
    final local = value.toLocal();
    String two(int value) => value.toString().padLeft(2, '0');
    return '${two(local.day)}/${two(local.month)}/${local.year} '
        '${two(local.hour)}:${two(local.minute)}';
  }

  Future<void> _run(
    StaffReturnCase entry,
    Future<void> Function() action,
  ) async {
    if (_busyId != null) return;
    setState(() {
      _busyId = entry.id;
      _error = null;
    });
    try {
      await action();
      await _load();
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = _message(error, 'Return action failed.'));
    } finally {
      if (mounted) {
        setState(() => _busyId = null);
      }
    }
  }

  Future<void> _review(StaffReturnCase entry, bool approve) async {
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(approve ? 'Approve return' : 'Reject return'),
        content: TextField(
          controller: controller,
          minLines: 2,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Staff note (optional)',
          ),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(approve ? 'Approve' : 'Reject'),
          ),
        ],
      ),
    );
    final note = controller.text.trim();
    controller.dispose();
    if (confirmed != true || !mounted) return;

    await _run(
      entry,
      () => approve
          ? _repository.approveReturn(entry.id, note: note)
          : _repository.rejectReturn(entry.id, note: note),
    );
  }

  Future<void> _inspect(StaffReturnCase entry) async {
    final result = await showDialog<List<StaffReturnInspection>>(
      context: context,
      builder: (context) => _InspectionDialog(
        entry: entry,
        conditions: _conditions,
        dispositions: _dispositions,
      ),
    );
    if (result == null || !mounted) return;
    await _run(entry, () => _repository.inspectReturn(entry.id, result));
  }

  Future<void> _confirmAction(
    StaffReturnCase entry, {
    required String title,
    required String message,
    required String button,
    required Future<void> Function() action,
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(button),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await _run(entry, action);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Returns operations'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loading ? null : _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          children: <Widget>[
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: _statuses
                  .map(
                    (value) => DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    ),
                  )
                  .toList(growable: false),
              onChanged: (value) {
                if (value == null) return;
                setState(() => _status = value);
                _load();
              },
            ),
            if (_error != null) ...<Widget>[
              const SizedBox(height: 14),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Text(_error!),
                ),
              ),
            ],
            const SizedBox(height: 14),
            if (_loading && _cases.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_cases.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(
                  child: Text('No return cases match this filter.'),
                ),
              )
            else
              ..._cases.map(_caseCard),
          ],
        ),
      ),
    );
  }

  Widget _caseCard(StaffReturnCase entry) {
    final busy = _busyId == entry.id;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
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
                      Text(
                        entry.order.orderNumber,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Text(entry.order.email),
                      const SizedBox(height: 4),
                      Text('${entry.reason} · ${_date(entry.requestedAt)}'),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Chip(label: Text(entry.status)),
              ],
            ),
            if (entry.customerNote != null) ...<Widget>[
              const SizedBox(height: 10),
              Text(entry.customerNote!),
            ],
            const SizedBox(height: 12),
            ...entry.items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        '${item.orderItem.productName} · '
                        '${item.orderItem.variantName} · '
                        '${item.orderItem.sku}\n'
                        'Return qty ${item.quantity}'
                        '${item.condition == null ? '' : ' · ${item.condition}'}'
                        '${item.disposition == null ? '' : ' · ${item.disposition}'}',
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      _money(
                        item.orderItem.unitPriceCents * item.quantity,
                        entry.order.currency,
                      ),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ),
            if (entry.refund != null) ...<Widget>[
              const SizedBox(height: 6),
              Text(
                'Refund: ${entry.refund!.status} · '
                '${_money(entry.refund!.amountCents, entry.refund!.currency)}',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ],
            if (entry.staffNote != null) ...<Widget>[
              const SizedBox(height: 6),
              Text('Staff note: ${entry.staffNote}'),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                if (entry.status == 'REQUESTED') ...<Widget>[
                  FilledButton.tonal(
                    onPressed: busy ? null : () => _review(entry, true),
                    child: const Text('Approve'),
                  ),
                  FilledButton.tonal(
                    onPressed: busy ? null : () => _review(entry, false),
                    child: const Text('Reject'),
                  ),
                ],
                if (entry.status == 'APPROVED') ...<Widget>[
                  FilledButton.tonal(
                    onPressed: busy
                        ? null
                        : () => _confirmAction(
                              entry,
                              title: 'Mark in transit',
                              message:
                                  'Mark this approved return as in transit?',
                              button: 'Mark in transit',
                              action: () =>
                                  _repository.markReturnInTransit(entry.id),
                            ),
                    child: const Text('Mark in transit'),
                  ),
                  FilledButton.tonal(
                    onPressed: busy
                        ? null
                        : () => _confirmAction(
                              entry,
                              title: 'Receive return',
                              message: 'Receive this return now?',
                              button: 'Receive now',
                              action: () => _repository.receiveReturn(entry.id),
                            ),
                    child: const Text('Receive now'),
                  ),
                ],
                if (entry.status == 'IN_TRANSIT')
                  FilledButton.tonal(
                    onPressed: busy
                        ? null
                        : () => _confirmAction(
                              entry,
                              title: 'Receive return',
                              message: 'Mark this return as received?',
                              button: 'Mark received',
                              action: () => _repository.receiveReturn(entry.id),
                            ),
                    child: const Text('Mark received'),
                  ),
                if (entry.status == 'RECEIVED') ...<Widget>[
                  FilledButton.tonal(
                    onPressed: busy ? null : () => _inspect(entry),
                    child: const Text('Save inspection'),
                  ),
                  FilledButton.tonal(
                    onPressed: busy
                        ? null
                        : () => _confirmAction(
                              entry,
                              title: 'Complete return',
                              message:
                                  'Complete this return and continue refund processing?',
                              button: 'Complete & refund',
                              action: () =>
                                  _repository.completeReturn(entry.id),
                            ),
                    child: const Text('Complete & refund'),
                  ),
                ],
                if (busy)
                  const Padding(
                    padding: EdgeInsets.all(10),
                    child: SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InspectionDialog extends StatefulWidget {
  const _InspectionDialog({
    required this.entry,
    required this.conditions,
    required this.dispositions,
  });

  final StaffReturnCase entry;
  final List<String> conditions;
  final List<String> dispositions;

  @override
  State<_InspectionDialog> createState() => _InspectionDialogState();
}

class _InspectionDialogState extends State<_InspectionDialog> {
  late final Map<String, String> _condition;
  late final Map<String, String> _disposition;

  @override
  void initState() {
    super.initState();
    _condition = <String, String>{
      for (final item in widget.entry.items)
        item.id: item.condition ?? 'OPENED',
    };
    _disposition = <String, String>{
      for (final item in widget.entry.items)
        item.id: item.disposition ?? 'QUARANTINE',
    };
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Inspect returned items'),
      content: SizedBox(
        width: 520,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: widget.entry.items.map((item) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      '${item.orderItem.productName} · ${item.orderItem.sku}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _condition[item.id],
                      decoration: const InputDecoration(labelText: 'Condition'),
                      items: widget.conditions
                          .map(
                            (value) => DropdownMenuItem<String>(
                              value: value,
                              child: Text(value),
                            ),
                          )
                          .toList(growable: false),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => _condition[item.id] = value);
                        }
                      },
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _disposition[item.id],
                      decoration:
                          const InputDecoration(labelText: 'Disposition'),
                      items: widget.dispositions
                          .map(
                            (value) => DropdownMenuItem<String>(
                              value: value,
                              child: Text(value),
                            ),
                          )
                          .toList(growable: false),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() => _disposition[item.id] = value);
                        }
                      },
                    ),
                  ],
                ),
              );
            }).toList(growable: false),
          ),
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            Navigator.pop(
              context,
              widget.entry.items
                  .map(
                    (item) => StaffReturnInspection(
                      returnItemId: item.id,
                      condition: _condition[item.id] ?? 'OPENED',
                      disposition: _disposition[item.id] ?? 'QUARANTINE',
                    ),
                  )
                  .toList(growable: false),
            );
          },
          child: const Text('Save inspection'),
        ),
      ],
    );
  }
}
