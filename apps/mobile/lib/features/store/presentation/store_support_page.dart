import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../domain/store_info.dart';
import 'store_support_providers.dart';

enum StoreSupportSection {
  about,
  delivery,
  returns,
  contact,
  faq,
  trust,
  terms,
  privacy,
}

class StoreSupportPage extends ConsumerWidget {
  const StoreSupportPage({super.key});

  static const _items = <(StoreSupportSection, IconData, String, String)>[
    (StoreSupportSection.about, Icons.storefront_outlined, 'Our store', 'Who we are and what the shop stands for'),
    (StoreSupportSection.delivery, Icons.local_shipping_outlined, 'Delivery', 'Shipping rates, timing and free-delivery rules'),
    (StoreSupportSection.returns, Icons.assignment_return_outlined, 'Returns', 'Return process and eligibility'),
    (StoreSupportSection.contact, Icons.support_agent_outlined, 'Contact us', 'Store contact details and support hours'),
    (StoreSupportSection.faq, Icons.help_outline_rounded, 'FAQ', 'Common customer questions'),
    (StoreSupportSection.trust, Icons.verified_user_outlined, 'Trust & safety', 'How the store keeps shopping clear and safe'),
    (StoreSupportSection.terms, Icons.description_outlined, 'Terms', 'Store terms and conditions'),
    (StoreSupportSection.privacy, Icons.privacy_tip_outlined, 'Privacy', 'How customer information is handled'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final info = ref.watch(storeInfoProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Store & Support')),
      body: info.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: FilledButton(
            onPressed: () => ref.invalidate(storeInfoProvider),
            child: const Text('Retry'),
          ),
        ),
        data: (store) => ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          children: <Widget>[
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: const Color(0xFF171717),
                borderRadius: BorderRadius.circular(28),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Icon(Icons.storefront_rounded, color: Color(0xFFDBFF4B), size: 32),
                  const SizedBox(height: 18),
                  Text(store.storeName, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
                  if (store.storeTagline.trim().isNotEmpty) ...<Widget>[
                    const SizedBox(height: 8),
                    Text(store.storeTagline, style: TextStyle(color: Colors.white.withValues(alpha: .72), height: 1.45)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),
            ..._items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Card(
                    elevation: 0,
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      leading: CircleAvatar(
                        backgroundColor: const Color(0xFFDBFF4B),
                        foregroundColor: const Color(0xFF171717),
                        child: Icon(item.$2),
                      ),
                      title: Text(item.$3, style: const TextStyle(fontWeight: FontWeight.w800)),
                      subtitle: Text(item.$4),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => StoreSupportDetailPage(store: store, section: item.$1),
                        ),
                      ),
                    ),
                  ),
                )),
          ],
        ),
      ),
    );
  }
}

class StoreSupportDetailPage extends StatelessWidget {
  const StoreSupportDetailPage({
    super.key,
    required this.store,
    required this.section,
  });

  final StoreInfo store;
  final StoreSupportSection section;

  String _money(int cents, String currency) {
    final amount = (cents / 100).toStringAsFixed(2);
    return currency.toUpperCase() == 'MYR'
        ? 'RM $amount'
        : '${currency.toUpperCase()} $amount';
  }

  String get title => switch (section) {
        StoreSupportSection.about => 'Our store',
        StoreSupportSection.delivery => 'Delivery',
        StoreSupportSection.returns => 'Returns',
        StoreSupportSection.contact => 'Contact us',
        StoreSupportSection.faq => 'FAQ',
        StoreSupportSection.trust => 'Trust & safety',
        StoreSupportSection.terms => 'Terms',
        StoreSupportSection.privacy => 'Privacy',
      };

  String get content => switch (section) {
        StoreSupportSection.about => store.storeDescription,
        StoreSupportSection.delivery => store.deliveryPolicy,
        StoreSupportSection.returns => store.returnsPolicy,
        StoreSupportSection.contact => '',
        StoreSupportSection.faq => store.faqContent,
        StoreSupportSection.trust => store.trustSafetyContent,
        StoreSupportSection.terms => store.termsContent,
        StoreSupportSection.privacy => store.privacyContent,
      };

  IconData get _icon => switch (section) {
        StoreSupportSection.about => Icons.storefront_rounded,
        StoreSupportSection.delivery => Icons.local_shipping_rounded,
        StoreSupportSection.returns => Icons.assignment_return_rounded,
        StoreSupportSection.contact => Icons.support_agent_rounded,
        StoreSupportSection.faq => Icons.help_rounded,
        StoreSupportSection.trust => Icons.verified_user_rounded,
        StoreSupportSection.terms => Icons.description_rounded,
        StoreSupportSection.privacy => Icons.privacy_tip_rounded,
      };

  String get _eyebrow => switch (section) {
        StoreSupportSection.about => 'VISIT US',
        StoreSupportSection.delivery => 'SHIPPING & DELIVERY',
        StoreSupportSection.returns => 'RETURNS & REFUNDS',
        StoreSupportSection.contact => 'CUSTOMER SUPPORT',
        StoreSupportSection.faq => 'HELP CENTRE',
        StoreSupportSection.trust => 'SHOP WITH CONFIDENCE',
        StoreSupportSection.terms => 'STORE CONDITIONS',
        StoreSupportSection.privacy => 'YOUR INFORMATION',
      };

  String get _intro => switch (section) {
        StoreSupportSection.about =>
          'Explore our stores, opening hours and branch details.',
        StoreSupportSection.delivery =>
          'Everything you need to know before your order arrives.',
        StoreSupportSection.returns =>
          'Clear guidance for eligible returns and refunds.',
        StoreSupportSection.contact =>
          'Need help? Reach our store team through the channels below.',
        StoreSupportSection.faq =>
          'Quick answers to the questions customers ask most often.',
        StoreSupportSection.trust =>
          'Practical guidance for safer shopping and account protection.',
        StoreSupportSection.terms =>
          'Important information about using the store and placing orders.',
        StoreSupportSection.privacy =>
          'How store and order information is handled when you shop with us.',
      };

  @override
  Widget build(BuildContext context) {
    final body = content.trim().isEmpty
        ? 'This information is being prepared by the store team.'
        : content.trim();

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 36),
        children: <Widget>[
          _SupportHero(
            eyebrow: _eyebrow,
            title: title,
            description: _intro,
            icon: _icon,
          ),
          const SizedBox(height: 20),
          if (section == StoreSupportSection.contact) ...<Widget>[
            _SupportSectionLabel(title: 'Get in touch'),
            const SizedBox(height: 10),
            _SupportInfoCard(
              icon: Icons.mail_outline_rounded,
              label: 'Email',
              value: store.contactEmail,
            ),
            _SupportInfoCard(
              icon: Icons.call_outlined,
              label: 'Phone',
              value: store.contactPhone,
            ),
            _SupportInfoCard(
              icon: Icons.schedule_rounded,
              label: 'Support hours',
              value: store.businessHours,
            ),
          ] else if (section == StoreSupportSection.delivery) ...<Widget>[
            _SupportSectionLabel(title: 'Delivery at a glance'),
            const SizedBox(height: 10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Expanded(
                  child: _SupportMetricCard(
                    icon: Icons.local_shipping_outlined,
                    label: 'Standard delivery',
                    value: _money(
                      store.standardShippingCents,
                      store.currency,
                    ),
                  ),
                ),
                if (store.freeShippingThresholdCents > 0) ...<Widget>[
                  const SizedBox(width: 10),
                  Expanded(
                    child: _SupportMetricCard(
                      icon: Icons.redeem_outlined,
                      label: 'Free delivery',
                      value:
                          'Over ${_money(store.freeShippingThresholdCents, store.currency)}',
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 22),
            _SupportSectionLabel(title: 'Delivery details'),
            const SizedBox(height: 10),
            _SupportReadingCard(text: body),
          ] else if (section == StoreSupportSection.about) ...<Widget>[
            _SupportReadingCard(text: body),
            const SizedBox(height: 24),
            if (store.locations.isNotEmpty) ...<Widget>[
              _SupportSectionLabel(
                title: 'Our locations',
                trailing: '${store.locations.length} stores',
              ),
              const SizedBox(height: 10),
              ...store.locations.map(
                (location) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Card(
                    clipBehavior: Clip.antiAlias,
                    elevation: 0,
                    child: InkWell(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => StoreLocationDetailPage(
                            store: store,
                            location: location,
                          ),
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: <Widget>[
                            ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: location.coverUrl.isNotEmpty
                                  ? Container(
                                      width: 112,
                                      height: 112,
                                      color: const Color(0xFFF5F5F2),
                                      child: Image.network(
                                        location.coverUrl,
                                        fit: BoxFit.cover,
                                      ),
                                    )
                                  : Container(
                                      width: 112,
                                      height: 112,
                                      color: const Color(0xFF171717),
                                      alignment: Alignment.center,
                                      child: const Text(
                                        'STORE',
                                        style: TextStyle(
                                          color: Color(0xFFDBFF4B),
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  Row(
                                    children: <Widget>[
                                      Expanded(
                                        child: Text(
                                          location.name,
                                          style: const TextStyle(
                                            fontSize: 17,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ),
                                      if (location.isPrimary)
                                        const Padding(
                                          padding: EdgeInsets.only(left: 6),
                                          child: Chip(label: Text('Primary')),
                                        ),
                                    ],
                                  ),
                                  if (location.formattedAddress.isNotEmpty)
                                    Text(
                                      location.formattedAddress,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  if (location.businessHours.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 5),
                                      child: Text(
                                        location.businessHours,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  if (location.phone.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 5),
                                      child: Text(
                                        location.phone,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right_rounded),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ] else ...<Widget>[
              _SupportInfoCard(
                icon: Icons.location_on_outlined,
                label: 'Store location',
                value: store.formattedAddress,
              ),
              _SupportInfoCard(
                icon: Icons.schedule_rounded,
                label: 'Business hours',
                value: store.businessHours,
              ),
            ],
          ] else if (section == StoreSupportSection.faq) ...<Widget>[
            _SupportSectionLabel(title: 'Frequently asked questions'),
            const SizedBox(height: 10),
            _FaqAccordion(content: body),
          ] else if (section == StoreSupportSection.returns) ...<Widget>[
            _SupportHighlightCard(
              icon: Icons.assignment_return_outlined,
              title: 'Simple return guidance',
              description:
                  'Check eligibility, item condition and refund details below.',
            ),
            const SizedBox(height: 18),
            _SupportSectionLabel(title: 'Returns policy'),
            const SizedBox(height: 10),
            _SupportReadingCard(text: body),
          ] else if (section == StoreSupportSection.trust) ...<Widget>[
            const Row(
              children: <Widget>[
                Expanded(
                  child: _SupportMiniFeature(
                    icon: Icons.lock_outline_rounded,
                    label: 'Secure account',
                  ),
                ),
                SizedBox(width: 10),
                Expanded(
                  child: _SupportMiniFeature(
                    icon: Icons.payments_outlined,
                    label: 'Clear payments',
                  ),
                ),
                SizedBox(width: 10),
                Expanded(
                  child: _SupportMiniFeature(
                    icon: Icons.shield_outlined,
                    label: 'Safer shopping',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),
            _SupportSectionLabel(title: 'Trust & safety guidance'),
            const SizedBox(height: 10),
            _SupportReadingCard(text: body),
          ] else ...<Widget>[
            _SupportSectionLabel(
              title: section == StoreSupportSection.privacy
                  ? 'Privacy information'
                  : 'Terms & conditions',
            ),
            const SizedBox(height: 10),
            _SupportReadingCard(text: body),
          ],
        ],
      ),
    );
  }
}

class _SupportHero extends StatelessWidget {
  const _SupportHero({
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.icon,
  });

  final String eyebrow;
  final String title;
  final String description;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFF171717),
        borderRadius: BorderRadius.circular(26),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: const Color(0xFFDBFF4B),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: const Color(0xFF171717)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  eyebrow,
                  style: const TextStyle(
                    color: Color(0xFFDBFF4B),
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 7),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 7),
                Text(
                  description,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: .68),
                    height: 1.45,
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

class _SupportSectionLabel extends StatelessWidget {
  const _SupportSectionLabel({required this.title, this.trailing});

  final String title;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
          ),
        ),
        if (trailing != null)
          Text(
            trailing!,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
      ],
    );
  }
}

class _SupportInfoCard extends StatelessWidget {
  const _SupportInfoCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final display = value.trim().isEmpty ? 'Not provided' : value.trim();
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: <Widget>[
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFDBFF4B),
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(icon, size: 21, color: const Color(0xFF171717)),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    label.toUpperCase(),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: .7,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    display,
                    style: const TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SupportMetricCard extends StatelessWidget {
  const _SupportMetricCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 126),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, color: const Color(0xFF171717)),
          const SizedBox(height: 14),
          Text(
            label,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
          ),
        ],
      ),
    );
  }
}

class _SupportReadingCard extends StatelessWidget {
  const _SupportReadingCard({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final paragraphs = text
        .split(RegExp(r'\n\s*\n'))
        .map((part) => part.trim())
        .where((part) => part.isNotEmpty)
        .toList(growable: false);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          for (var index = 0; index < paragraphs.length; index++) ...<Widget>[
            if (index > 0) const SizedBox(height: 16),
            Text(
              paragraphs[index],
              style: const TextStyle(height: 1.7, fontSize: 15.5),
            ),
          ],
        ],
      ),
    );
  }
}

class _SupportHighlightCard extends StatelessWidget {
  const _SupportHighlightCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFDBFF4B),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: <Widget>[
          Icon(icon, size: 30, color: const Color(0xFF171717)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF171717),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    height: 1.4,
                    color: Color(0xFF171717),
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

class _SupportMiniFeature extends StatelessWidget {
  const _SupportMiniFeature({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 106),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(icon, size: 23),
          const SizedBox(height: 12),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              height: 1.25,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _FaqAccordion extends StatefulWidget {
  const _FaqAccordion({required this.content});

  final String content;

  @override
  State<_FaqAccordion> createState() => _FaqAccordionState();
}

class _FaqAccordionState extends State<_FaqAccordion> {
  late final List<(String, String)> _items;

  @override
  void initState() {
    super.initState();
    _items = _parse(widget.content);
  }

  List<(String, String)> _parse(String content) {
    final blocks = content
        .split(RegExp(r'\n\s*\n'))
        .map((block) => block.trim())
        .where((block) => block.isNotEmpty)
        .toList(growable: false);
    final result = <(String, String)>[];

    for (final block in blocks) {
      final lines = block
          .split('\n')
          .map((line) => line.trim())
          .where((line) => line.isNotEmpty)
          .toList(growable: false);
      if (lines.length >= 2) {
        result.add((lines.first, lines.skip(1).join('\n')));
      } else if (lines.isNotEmpty) {
        result.add(('Information', lines.first));
      }
    }

    if (result.isEmpty) {
      result.add(('Information', content));
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: _items
          .map(
            (item) => Card(
              elevation: 0,
              margin: const EdgeInsets.only(bottom: 10),
              clipBehavior: Clip.antiAlias,
              child: ExpansionTile(
                tilePadding: const EdgeInsets.symmetric(horizontal: 16),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 18),
                title: Text(
                  item.$1,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                children: <Widget>[
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      item.$2,
                      style: const TextStyle(height: 1.6),
                    ),
                  ),
                ],
              ),
            ),
          )
          .toList(growable: false),
    );
  }
}

class StoreLocationDetailPage extends StatelessWidget {
  const StoreLocationDetailPage({
    super.key,
    required this.store,
    required this.location,
  });

  final StoreInfo store;
  final StoreLocation location;

  Future<void> _callStore(BuildContext context) async {
    final phone = location.phone.trim();
    if (phone.isEmpty) return;
    final uri = Uri(scheme: 'tel', path: phone);
    if (!await launchUrl(uri)) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open the phone app.')),
      );
    }
  }

  Future<void> _openDirections(BuildContext context) async {
    final address = location.formattedAddress.trim();
    if (address.isEmpty) return;
    final uri = Uri.https(
      'www.google.com',
      '/maps/search/',
      <String, String>{'api': '1', 'query': address},
    );
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open directions.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final photos = <String>{
      if (location.coverUrl.trim().isNotEmpty) location.coverUrl.trim(),
      ...location.galleryUrls
          .map((url) => url.trim())
          .where((url) => url.isNotEmpty),
    }.toList(growable: false);

    return Scaffold(
      appBar: AppBar(title: Text(location.name)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 36),
        children: <Widget>[
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF171717),
              borderRadius: BorderRadius.circular(26),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFFDBFF4B),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: const Icon(
                        Icons.storefront_rounded,
                        color: Color(0xFF171717),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          if (location.isPrimary)
                            const _PrimaryStoreBadge(),
                          if (location.isPrimary) const SizedBox(height: 8),
                          Text(
                            location.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 25,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          if (location.formattedAddress.trim().isNotEmpty) ...<Widget>[
                            const SizedBox(height: 7),
                            Text(
                              location.formattedAddress,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: .68),
                                height: 1.4,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                if (location.description.trim().isNotEmpty) ...<Widget>[
                  const SizedBox(height: 18),
                  Text(
                    location.description.trim(),
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: .78),
                      height: 1.55,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (photos.isNotEmpty) ...<Widget>[
            const SizedBox(height: 20),
            _StorePhotoCarousel(
              photos: photos,
              locationName: location.name,
            ),
          ],
          const SizedBox(height: 24),
          const _SupportSectionLabel(title: 'Visit this store'),
          const SizedBox(height: 10),
          if (location.formattedAddress.trim().isNotEmpty)
            _StoreDetailInfoCard(
              icon: Icons.location_on_outlined,
              label: 'Address',
              value: location.formattedAddress,
            ),
          if (location.businessHours.trim().isNotEmpty)
            _StoreDetailInfoCard(
              icon: Icons.schedule_rounded,
              label: 'Business hours',
              value: location.businessHours,
            ),
          if (location.phone.trim().isNotEmpty)
            _StoreDetailInfoCard(
              icon: Icons.call_outlined,
              label: 'Contact',
              value: location.phone,
            ),
          if (location.phone.trim().isNotEmpty ||
              location.formattedAddress.trim().isNotEmpty) ...<Widget>[
            const SizedBox(height: 6),
            Row(
              children: <Widget>[
                if (location.phone.trim().isNotEmpty)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _callStore(context),
                      icon: const Icon(Icons.call_outlined),
                      label: const Text('Call store'),
                    ),
                  ),
                if (location.phone.trim().isNotEmpty &&
                    location.formattedAddress.trim().isNotEmpty)
                  const SizedBox(width: 10),
                if (location.formattedAddress.trim().isNotEmpty)
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => _openDirections(context),
                      icon: const Icon(Icons.directions_outlined),
                      label: const Text('Directions'),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _PrimaryStoreBadge extends StatelessWidget {
  const _PrimaryStoreBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFDBFF4B),
        borderRadius: BorderRadius.circular(999),
      ),
      child: const Text(
        'PRIMARY STORE',
        style: TextStyle(
          color: Color(0xFF171717),
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: .8,
        ),
      ),
    );
  }
}

class _StoreDetailInfoCard extends StatelessWidget {
  const _StoreDetailInfoCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFDBFF4B),
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(
                icon,
                size: 21,
                color: const Color(0xFF171717),
              ),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    label.toUpperCase(),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: .7,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    value.trim(),
                    style: const TextStyle(
                      fontSize: 15.5,
                      height: 1.45,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StorePhotoCarousel extends StatefulWidget {
  const _StorePhotoCarousel({
    required this.photos,
    required this.locationName,
  });

  final List<String> photos;
  final String locationName;

  @override
  State<_StorePhotoCarousel> createState() => _StorePhotoCarouselState();
}

class _StorePhotoCarouselState extends State<_StorePhotoCarousel> {
  late final PageController _pageController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _goTo(int index) {
    return _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
  }

  void _onPageChanged(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final photos = widget.photos;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: AspectRatio(
            aspectRatio: 1,
            child: PageView.builder(
              controller: _pageController,
              itemCount: photos.length,
              onPageChanged: _onPageChanged,
              itemBuilder: (context, index) => Image.network(
                photos[index],
                fit: BoxFit.cover,
                semanticLabel: '${widget.locationName} photo ${index + 1}',
              ),
            ),
          ),
        ),
        if (photos.length > 1) ...<Widget>[
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List<Widget>.generate(photos.length, (index) {
              final selected = index == _currentIndex;
              return GestureDetector(
                onTap: () => _goTo(index),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 76,
                  height: 76,
                  padding: EdgeInsets.all(selected ? 3 : 0),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(13),
                    border: selected
                        ? Border.all(
                            color: const Color(0xFF171717),
                            width: 2,
                          )
                        : null,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.network(
                      photos[index],
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '${_currentIndex + 1}/${photos.length}',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
