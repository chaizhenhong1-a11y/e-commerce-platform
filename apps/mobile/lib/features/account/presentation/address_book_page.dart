import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/domain/auth_state.dart';
import '../../auth/presentation/auth_providers.dart';
import '../domain/customer_address.dart';
import 'address_book_providers.dart';

class AddressBookPage extends ConsumerWidget {
  const AddressBookPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    if (auth.status == AuthStatus.checking) {
      return Scaffold(
        appBar: AppBar(title: Text('Addresses')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Addresses')),
        body: Center(
          child: FilledButton(
            onPressed: () => context.push('/sign-in'),
            child: const Text('Sign in to manage addresses'),
          ),
        ),
      );
    }

    final addresses = ref.watch(customerAddressesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Addresses'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Add address',
            onPressed: () => _showAddressEditor(context, ref),
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(customerAddressesProvider.future),
        child: addresses.when(
          loading: () => const _AddressLoading(),
          error: (error, stackTrace) => _AddressError(
            message: error.toString(),
            onRetry: () => ref.invalidate(customerAddressesProvider),
          ),
          data: (items) => items.isEmpty
              ? _EmptyAddresses(
                  onAdd: () => _showAddressEditor(context, ref),
                )
              : ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                  itemCount: items.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 12),
                  itemBuilder: (context, index) => _AddressCard(
                    address: items[index],
                    onEdit: () =>
                        _showAddressEditor(context, ref, items[index]),
                    onMakeDefault: items[index].isDefault
                        ? null
                        : () => _setDefault(
                              context,
                              ref,
                              items[index],
                            ),
                    onDelete: () => _deleteAddress(context, ref, items[index]),
                  ),
                ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddressEditor(context, ref),
        icon: const Icon(Icons.add_location_alt_outlined),
        label: const Text('Add address'),
      ),
    );
  }

  Future<void> _showAddressEditor(
    BuildContext context,
    WidgetRef ref, [
    CustomerAddress? address,
  ]) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _AddressEditor(address: address),
    );

    if (saved == true) {
      ref.invalidate(customerAddressesProvider);
    }
  }

  Future<void> _setDefault(
    BuildContext context,
    WidgetRef ref,
    CustomerAddress address,
  ) async {
    try {
      await ref.read(customerRepositoryProvider).setDefaultAddress(address.id);
      ref.invalidate(customerAddressesProvider);
    } on DioException catch (error) {
      if (!context.mounted) return;
      _showMessage(context, _messageFrom(error, 'Unable to update address.'));
    }
  }

  Future<void> _deleteAddress(
    BuildContext context,
    WidgetRef ref,
    CustomerAddress address,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove address?'),
        content: Text(
          'Remove "${address.label}" from your address book?',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref.read(customerRepositoryProvider).deleteAddress(address.id);
      ref.invalidate(customerAddressesProvider);
    } on DioException catch (error) {
      if (!context.mounted) return;
      _showMessage(context, _messageFrom(error, 'Unable to remove address.'));
    }
  }

  void _showMessage(BuildContext context, String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }
}

class _AddressEditor extends ConsumerStatefulWidget {
  const _AddressEditor({this.address});

  final CustomerAddress? address;

  @override
  ConsumerState<_AddressEditor> createState() => _AddressEditorState();
}

class _AddressEditorState extends ConsumerState<_AddressEditor> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _label;
  late final TextEditingController _recipient;
  late final TextEditingController _phone;
  late final TextEditingController _line1;
  late final TextEditingController _line2;
  late final TextEditingController _city;
  late final TextEditingController _state;
  late final TextEditingController _postcode;

  late bool _isDefault;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final address = widget.address;
    final user = ref.read(authControllerProvider).user;

    _label = TextEditingController(text: address?.label ?? 'Home');
    _recipient = TextEditingController(
      text: address?.recipientName ?? user?.displayName ?? '',
    );
    _phone = TextEditingController(text: address?.phone ?? '');
    _line1 = TextEditingController(text: address?.line1 ?? '');
    _line2 = TextEditingController(text: address?.line2 ?? '');
    _city = TextEditingController(text: address?.city ?? '');
    _state = TextEditingController(text: address?.state ?? '');
    _postcode = TextEditingController(text: address?.postcode ?? '');
    _isDefault = address?.isDefault ?? false;
  }

  @override
  void dispose() {
    _label.dispose();
    _recipient.dispose();
    _phone.dispose();
    _line1.dispose();
    _line2.dispose();
    _city.dispose();
    _state.dispose();
    _postcode.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate() || _saving) return;

    setState(() {
      _saving = true;
      _error = null;
    });

    final input = CustomerAddressInput(
      label: _label.text,
      recipientName: _recipient.text,
      phone: _phone.text,
      line1: _line1.text,
      line2: _line2.text,
      city: _city.text,
      state: _state.text,
      postcode: _postcode.text,
      isDefault: _isDefault,
    );

    try {
      final repository = ref.read(customerRepositoryProvider);
      if (widget.address == null) {
        await repository.createAddress(input);
      } else {
        await repository.updateAddress(widget.address!.id, input);
      }
      if (mounted) Navigator.pop(context, true);
    } on DioException catch (error) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = _messageFrom(error, 'Unable to save address.');
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = 'Unable to save address.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.92,
        minChildSize: 0.65,
        maxChildSize: 0.96,
        builder: (context, scrollController) => Form(
          key: _formKey,
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            children: <Widget>[
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                widget.address == null ? 'Add address' : 'Edit address',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
              ),
              const SizedBox(height: 20),
              _field(_label, 'Label', minLength: 1),
              _field(_recipient, 'Recipient name', minLength: 1),
              _field(
                _phone,
                'Phone',
                minLength: 5,
                keyboardType: TextInputType.phone,
              ),
              _field(_line1, 'Address line 1', minLength: 3),
              _field(_line2, 'Address line 2', required: false),
              Row(
                children: <Widget>[
                  Expanded(child: _field(_postcode, 'Postcode', minLength: 4)),
                  const SizedBox(width: 12),
                  Expanded(child: _field(_city, 'City', minLength: 1)),
                ],
              ),
              _field(_state, 'State', minLength: 1),
              TextFormField(
                initialValue: 'Malaysia',
                enabled: false,
                decoration: const InputDecoration(labelText: 'Country'),
              ),
              const SizedBox(height: 8),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Default delivery address'),
                value: _isDefault,
                onChanged: widget.address?.isDefault == true
                    ? null
                    : (value) => setState(() => _isDefault = value),
              ),
              if (_error != null) ...<Widget>[
                const SizedBox(height: 8),
                Text(
                  _error!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                  ),
                ),
              ],
              const SizedBox(height: 18),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'Saving…' : 'Save address'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool required = true,
    int minLength = 0,
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(labelText: label),
        validator: (value) {
          if (!required) return null;
          if (value == null || value.trim().length < minLength) {
            return '$label is required.';
          }
          return null;
        },
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDelete,
    this.onMakeDefault,
  });

  final CustomerAddress address;
  final VoidCallback onEdit;
  final VoidCallback? onMakeDefault;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    address.label,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                ),
                if (address.isDefault)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color:
                          Theme.of(context).colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text(
                      'DEFAULT',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              address.recipientName,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 5),
            Text(address.line1),
            if (address.line2?.isNotEmpty ?? false) Text(address.line2!),
            Text('${address.postcode} ${address.city}, ${address.state}'),
            const SizedBox(height: 5),
            Text(address.phone),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: <Widget>[
                OutlinedButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined),
                  label: const Text('Edit'),
                ),
                if (onMakeDefault != null)
                  OutlinedButton.icon(
                    onPressed: onMakeDefault,
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Make default'),
                  ),
                TextButton.icon(
                  onPressed: onDelete,
                  icon: const Icon(Icons.delete_outline),
                  label: const Text('Remove'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyAddresses extends StatelessWidget {
  const _EmptyAddresses({required this.onAdd});

  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(28),
      children: <Widget>[
        const SizedBox(height: 80),
        const Icon(Icons.location_on_outlined, size: 54),
        const SizedBox(height: 16),
        Text(
          'No saved addresses',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Save an address once and reuse it when mobile checkout arrives.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 20),
        FilledButton.tonal(
          onPressed: onAdd,
          child: const Text('Add address'),
        ),
      ],
    );
  }
}

class _AddressLoading extends StatelessWidget {
  const _AddressLoading();

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) => const Card(
        child: SizedBox(
          height: 180,
          child: Center(child: CircularProgressIndicator()),
        ),
      ),
    );
  }
}

class _AddressError extends StatelessWidget {
  const _AddressError({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(28),
      children: <Widget>[
        const SizedBox(height: 80),
        const Icon(Icons.cloud_off_outlined, size: 52),
        const SizedBox(height: 16),
        Text(
          'Could not load addresses',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          message,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 20),
        FilledButton.tonal(
          onPressed: onRetry,
          child: const Text('Try again'),
        ),
      ],
    );
  }
}

String _messageFrom(DioException error, String fallback) {
  final data = error.response?.data;
  if (data is Map<String, dynamic>) {
    final message = data['message'];
    if (message is String && message.isNotEmpty) {
      return message;
    }
    if (message is List && message.isNotEmpty) {
      return message.first.toString();
    }
  }
  return fallback;
}
