import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/staff_store_location.dart';
import 'staff_store_settings_providers.dart';

class StaffStoreLocationsPanel extends ConsumerStatefulWidget {
  const StaffStoreLocationsPanel({super.key});

  @override
  ConsumerState<StaffStoreLocationsPanel> createState() => _State();
}

class _State extends ConsumerState<StaffStoreLocationsPanel> {
  List<StaffStoreLocation>? _items;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(_load);
  }

  Future<void> _load() async {
    try {
      final locations =
          await ref.read(staffStoreSettingsRepositoryProvider).getLocations();
      if (mounted) {
        setState(() => _items = locations);
      }
    } catch (_) {
      if (mounted) {
        setState(() => _items = <StaffStoreLocation>[]);
      }
    }
  }

  Future<void> _edit([StaffStoreLocation? current]) async {
    final result = await showDialog<StaffStoreLocation>(
      context: context,
      builder: (_) => _LocationDialog(
        initial: current,
        nextOrder: _items?.length ?? 0,
        upload: (files) async {
          final urls = <String>[];
          for (final file in files) {
            if (file.bytes != null) {
              urls.add(
                await ref
                    .read(staffStoreSettingsRepositoryProvider)
                    .uploadStorePhoto(
                      bytes: file.bytes!,
                      fileName: file.name,
                    ),
              );
            }
          }
          return urls;
        },
      ),
    );

    if (result == null) {
      return;
    }

    setState(() => _busy = true);
    try {
      await ref.read(staffStoreSettingsRepositoryProvider).saveLocation(result);
      await _load();
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _delete(StaffStoreLocation item) async {
    setState(() => _busy = true);
    try {
      await ref
          .read(staffStoreSettingsRepositoryProvider)
          .deleteLocation(item.id);
      await _load();
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;

    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Store locations',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 16,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Each branch has its own address, hours, phone and photos.',
                      ),
                    ],
                  ),
                ),
                OutlinedButton.icon(
                  onPressed: _busy ? null : () => _edit(),
                  icon: const Icon(Icons.add),
                  label: const Text('Add branch'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (items == null)
              const LinearProgressIndicator()
            else if (items.isEmpty)
              const Text('No branches yet. Add your first store location.')
            else
              ...items.map(
                (item) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: item.coverUrl.isEmpty
                      ? const CircleAvatar(
                          child: Icon(Icons.store_outlined),
                        )
                      : ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.network(
                            item.coverUrl,
                            width: 48,
                            height: 48,
                            fit: BoxFit.cover,
                          ),
                        ),
                  title: Text(
                    item.name,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  subtitle: Text(
                    [
                      item.addressLine1,
                      item.city,
                      item.state,
                    ].where((value) => value.isNotEmpty).join(', '),
                  ),
                  trailing: PopupMenuButton<String>(
                    onSelected: (value) {
                      if (value == 'edit') {
                        _edit(item);
                      }
                      if (value == 'delete') {
                        _delete(item);
                      }
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(value: 'edit', child: Text('Edit')),
                      PopupMenuItem(value: 'delete', child: Text('Delete')),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

typedef _Upload = Future<List<String>> Function(List<PlatformFile> files);

class _LocationDialog extends StatefulWidget {
  const _LocationDialog({
    required this.initial,
    required this.nextOrder,
    required this.upload,
  });

  final StaffStoreLocation? initial;
  final int nextOrder;
  final _Upload upload;

  @override
  State<_LocationDialog> createState() => _LocationDialogState();
}

class _LocationDialogState extends State<_LocationDialog> {
  late StaffStoreLocation value;
  final Map<String, TextEditingController> controllers = {};
  bool uploading = false;

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    value = initial ??
        StaffStoreLocation(
          id: '',
          name: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postcode: '',
          countryCode: 'MY',
          phone: '',
          businessHours: '',
          description: '',
          coverUrl: '',
          galleryUrls: const [],
          isPrimary: widget.nextOrder == 0,
          isActive: true,
          sortOrder: widget.nextOrder,
        );

    final fields = <String, String>{
      'name': value.name,
      'addressLine1': value.addressLine1,
      'addressLine2': value.addressLine2,
      'city': value.city,
      'state': value.state,
      'postcode': value.postcode,
      'countryCode': value.countryCode,
      'phone': value.phone,
      'businessHours': value.businessHours,
      'description': value.description,
    };

    for (final entry in fields.entries) {
      controllers[entry.key] = TextEditingController(text: entry.value);
    }
  }

  @override
  void dispose() {
    for (final controller in controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  StaffStoreLocation collect() {
    return value.copyWith(
      name: controllers['name']!.text.trim(),
      addressLine1: controllers['addressLine1']!.text.trim(),
      addressLine2: controllers['addressLine2']!.text.trim(),
      city: controllers['city']!.text.trim(),
      state: controllers['state']!.text.trim(),
      postcode: controllers['postcode']!.text.trim(),
      countryCode: controllers['countryCode']!.text.trim().toUpperCase(),
      phone: controllers['phone']!.text.trim(),
      businessHours: controllers['businessHours']!.text.trim(),
      description: controllers['description']!.text.trim(),
    );
  }

  List<String> get photos => [
        value.coverUrl,
        ...value.galleryUrls,
      ].where((url) => url.isNotEmpty).toList();

  void apply(List<String> updatedPhotos) {
    setState(() {
      value = value.copyWith(
        coverUrl: updatedPhotos.isEmpty ? '' : updatedPhotos.first,
        galleryUrls: updatedPhotos.skip(1).take(7).toList(),
      );
    });
  }

  Future<void> addPhotos() async {
    final remaining = 8 - photos.length;
    if (remaining <= 0) {
      return;
    }

    final picked = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
      allowMultiple: true,
    );
    if (picked == null) {
      return;
    }

    setState(() => uploading = true);
    try {
      final selected = picked.files
          .where((file) => file.bytes != null)
          .take(remaining)
          .toList();
      final uploaded = await widget.upload(selected);
      apply([...photos, ...uploaded]);
    } finally {
      if (mounted) {
        setState(() => uploading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const fields = <(String, String)>[
      ('name', 'Branch name'),
      ('addressLine1', 'Address line 1'),
      ('addressLine2', 'Address line 2'),
      ('city', 'City'),
      ('state', 'State'),
      ('postcode', 'Postcode'),
      ('countryCode', 'Country code'),
      ('phone', 'Branch phone'),
      ('businessHours', 'Business hours'),
      ('description', 'Branch introduction'),
    ];

    return AlertDialog(
      title: Text(widget.initial == null ? 'Add branch' : 'Edit branch'),
      content: SizedBox(
        width: 520,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (final field in fields)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: TextField(
                    controller: controllers[field.$1],
                    decoration: InputDecoration(labelText: field.$2),
                  ),
                ),
              SwitchListTile(
                value: value.isPrimary,
                onChanged: (enabled) {
                  setState(() => value = value.copyWith(isPrimary: enabled));
                },
                title: const Text('Primary branch'),
              ),
              SwitchListTile(
                value: value.isActive,
                onChanged: (enabled) {
                  setState(() => value = value.copyWith(isActive: enabled));
                },
                title: const Text('Visible to customers'),
              ),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Branch photos (${photos.length}/8)',
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(height: 8),
              if (photos.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: List.generate(photos.length, (index) {
                    final photo = photos[index];
                    return SizedBox(
                      width: 105,
                      child: Column(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.network(
                              photo,
                              width: 105,
                              height: 105,
                              fit: BoxFit.cover,
                            ),
                          ),
                          if (index == 0)
                            const Text(
                              'Cover',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          else
                            TextButton(
                              onPressed: () {
                                apply([
                                  photo,
                                  ...photos.where((url) => url != photo),
                                ]);
                              },
                              child: const Text('Set cover'),
                            ),
                          TextButton(
                            onPressed: () {
                              apply(
                                photos.where((url) => url != photo).toList(),
                              );
                            },
                            child: const Text('Remove'),
                          ),
                        ],
                      ),
                    );
                  }),
                ),
              if (photos.length < 8)
                OutlinedButton.icon(
                  onPressed: uploading ? null : addPhotos,
                  icon: const Icon(Icons.add_photo_alternate_outlined),
                  label: Text(uploading ? 'Uploading…' : 'Add photos'),
                ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: uploading
              ? null
              : () {
                  final location = collect();
                  if (location.name.isNotEmpty) {
                    Navigator.pop(context, location);
                  }
                },
          child: const Text('Save branch'),
        ),
      ],
    );
  }
}
