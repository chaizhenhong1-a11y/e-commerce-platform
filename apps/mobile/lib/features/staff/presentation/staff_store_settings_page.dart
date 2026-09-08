import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/staff_store_settings.dart';
import 'staff_store_settings_providers.dart';
import 'staff_store_locations_panel.dart';
import 'staff_ui_theme.dart';

class StaffStoreSettingsPage extends ConsumerStatefulWidget {
  const StaffStoreSettingsPage({super.key});

  @override
  ConsumerState<StaffStoreSettingsPage> createState() =>
      _StaffStoreSettingsPageState();
}

class _StaffStoreSettingsPageState
    extends ConsumerState<StaffStoreSettingsPage> {
  final _formKey = GlobalKey<FormState>();
  final _controllers = <String, TextEditingController>{};
  bool _initialized = false;
  bool _saving = false;

  TextEditingController _controller(String key) {
    return _controllers.putIfAbsent(key, TextEditingController.new);
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _hydrate(StaffStoreSettings data) {
    if (_initialized) {
      return;
    }
    _initialized = true;
    final values = <String, String>{
      'storeName': data.storeName,
      'logoUrl': data.logoUrl,
      'storeCoverUrl': data.storeCoverUrl,
      'storeGalleryUrls': data.storeGalleryUrls.join('\n'),
      'storeTagline': data.storeTagline,
      'storeDescription': data.storeDescription,
      'contactEmail': data.contactEmail,
      'contactPhone': data.contactPhone,
      'businessHours': data.businessHours,
      'addressLine1': data.addressLine1,
      'addressLine2': data.addressLine2,
      'city': data.city,
      'state': data.state,
      'postcode': data.postcode,
      'countryCode': data.countryCode,
      'currency': data.currency,
      'timeZone': data.timeZone,
      'standardShippingCents': data.standardShippingCents.toString(),
      'freeShippingThresholdCents': data.freeShippingThresholdCents.toString(),
      'deliveryPolicy': data.deliveryPolicy,
      'returnsPolicy': data.returnsPolicy,
      'faqContent': data.faqContent,
      'trustSafetyContent': data.trustSafetyContent,
      'termsContent': data.termsContent,
      'privacyContent': data.privacyContent,
      'instagramUrl': data.instagramUrl,
      'facebookUrl': data.facebookUrl,
      'tiktokUrl': data.tiktokUrl,
    };
    for (final entry in values.entries) {
      _controller(entry.key).text = entry.value;
    }
  }

  Future<void> _uploadLogo() async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
      allowMultiple: false,
    );
    final file =
        picked == null || picked.files.isEmpty ? null : picked.files.first;
    if (file?.bytes == null) {
      return;
    }

    try {
      final url = await ref
          .read(staffStoreSettingsRepositoryProvider)
          .uploadStorePhoto(bytes: file!.bytes!, fileName: file.name);
      _controller('logoUrl').text = url;
      if (mounted) {
        setState(() {});
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to upload store logo.')),
        );
      }
    }
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false) || _saving) {
      return;
    }
    setState(() => _saving = true);

    final settings = StaffStoreSettings(
      storeName: _controller('storeName').text.trim(),
      logoUrl: _controller('logoUrl').text.trim(),
      storeCoverUrl: _controller('storeCoverUrl').text.trim(),
      storeGalleryUrls: _controller('storeGalleryUrls')
          .text
          .split('\n')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .take(8)
          .toList(),
      storeTagline: _controller('storeTagline').text.trim(),
      storeDescription: _controller('storeDescription').text.trim(),
      contactEmail: _controller('contactEmail').text.trim(),
      contactPhone: _controller('contactPhone').text.trim(),
      businessHours: _controller('businessHours').text.trim(),
      addressLine1: _controller('addressLine1').text.trim(),
      addressLine2: _controller('addressLine2').text.trim(),
      city: _controller('city').text.trim(),
      state: _controller('state').text.trim(),
      postcode: _controller('postcode').text.trim(),
      countryCode: _controller('countryCode').text.trim().toUpperCase(),
      currency: _controller('currency').text.trim().toUpperCase(),
      timeZone: _controller('timeZone').text.trim(),
      standardShippingCents:
          int.tryParse(_controller('standardShippingCents').text) ?? 0,
      freeShippingThresholdCents:
          int.tryParse(_controller('freeShippingThresholdCents').text) ?? 0,
      deliveryPolicy: _controller('deliveryPolicy').text.trim(),
      returnsPolicy: _controller('returnsPolicy').text.trim(),
      faqContent: _controller('faqContent').text.trim(),
      trustSafetyContent: _controller('trustSafetyContent').text.trim(),
      termsContent: _controller('termsContent').text.trim(),
      privacyContent: _controller('privacyContent').text.trim(),
      instagramUrl: _controller('instagramUrl').text.trim(),
      facebookUrl: _controller('facebookUrl').text.trim(),
      tiktokUrl: _controller('tiktokUrl').text.trim(),
    );

    try {
      await ref.read(staffStoreSettingsRepositoryProvider).update(settings);
      ref.invalidate(staffStoreSettingsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Store settings saved.')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to save store settings.')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(staffStoreSettingsProvider);

    return StaffUiTheme(
      child: Scaffold(
        appBar: AppBar(title: const Text('Store Settings')),
        body: settings.when(
          data: (data) {
            _hydrate(data);
            return Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: <Widget>[
                  _Section(
                    title: 'Brand & public profile',
                    children: <Widget>[
                      _field('storeName', 'Store name', required: true),
                      const Text(
                        'Store logo',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      if (_controller('logoUrl')
                          .text
                          .trim()
                          .isNotEmpty) ...<Widget>[
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            width: 120,
                            height: 120,
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              border: Border.all(
                                  color: Theme.of(context).dividerColor),
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Image.network(
                              _controller('logoUrl').text.trim(),
                              fit: BoxFit.contain,
                              errorBuilder: (_, __, ___) =>
                                  const Icon(Icons.broken_image_outlined),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: <Widget>[
                            OutlinedButton.icon(
                              onPressed: _uploadLogo,
                              icon: const Icon(Icons.upload_outlined),
                              label: const Text('Replace logo'),
                            ),
                            TextButton.icon(
                              onPressed: () {
                                _controller('logoUrl').clear();
                                setState(() {});
                              },
                              icon: const Icon(Icons.delete_outline),
                              label: const Text('Remove'),
                            ),
                          ],
                        ),
                      ] else
                        OutlinedButton.icon(
                          onPressed: _uploadLogo,
                          icon: const Icon(Icons.upload_outlined),
                          label: const Text('Upload logo'),
                        ),
                      _field('storeTagline', 'Store tagline'),
                      _field('businessHours', 'Customer support hours'),
                      _field(
                        'storeDescription',
                        'About the store',
                        maxLines: 6,
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const StaffStoreLocationsPanel(),
                  const SizedBox(height: 14),
                  _Section(
                    title: 'Contact',
                    children: <Widget>[
                      _field(
                        'contactEmail',
                        'Contact email',
                        required: true,
                        keyboardType: TextInputType.emailAddress,
                      ),
                      _field('contactPhone', 'Contact phone'),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _Section(
                    title: 'Commerce & delivery',
                    children: <Widget>[
                      _field('currency', 'Currency', required: true),
                      _field('timeZone', 'Timezone', required: true),
                      _field(
                        'standardShippingCents',
                        'Standard shipping (cents)',
                        required: true,
                        keyboardType: TextInputType.number,
                      ),
                      _field(
                        'freeShippingThresholdCents',
                        'Free shipping threshold (cents)',
                        required: true,
                        keyboardType: TextInputType.number,
                      ),
                      _field(
                        'deliveryPolicy',
                        'Delivery information',
                        maxLines: 6,
                      ),
                      _field(
                        'returnsPolicy',
                        'Returns information',
                        maxLines: 6,
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _Section(
                    title: 'Customer information pages',
                    children: <Widget>[
                      _field('faqContent', 'FAQ', maxLines: 8),
                      _field(
                        'trustSafetyContent',
                        'Trust & safety',
                        maxLines: 6,
                      ),
                      _field('termsContent', 'Terms', maxLines: 9),
                      _field('privacyContent', 'Privacy', maxLines: 9),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _Section(
                    title: 'Social links',
                    children: <Widget>[
                      _field('instagramUrl', 'Instagram URL'),
                      _field('facebookUrl', 'Facebook URL'),
                      _field('tiktokUrl', 'TikTok URL'),
                    ],
                  ),
                  const SizedBox(height: 18),
                  FilledButton.icon(
                    onPressed: _saving ? null : _save,
                    icon: _saving
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.save_outlined),
                    label: Text(_saving ? 'Saving…' : 'Save settings'),
                  ),
                ],
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => Center(
            child: FilledButton(
              onPressed: () => ref.invalidate(staffStoreSettingsProvider),
              child: const Text('Retry'),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(
    String key,
    String label, {
    bool required = false,
    TextInputType? keyboardType,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: _controller(key),
      keyboardType: keyboardType,
      minLines: maxLines > 1 ? 3 : 1,
      maxLines: maxLines,
      decoration: InputDecoration(labelText: label, alignLabelWithHint: true),
      validator: required
          ? (value) => value == null || value.trim().isEmpty
              ? '$label is required.'
              : null
          : null,
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: 12),
            ...children.expand(
              (child) => <Widget>[child, const SizedBox(height: 10)],
            ),
          ],
        ),
      ),
    );
  }
}
