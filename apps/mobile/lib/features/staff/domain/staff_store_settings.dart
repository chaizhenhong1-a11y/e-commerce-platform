class StaffStoreSettings {
  const StaffStoreSettings({
    required this.storeName,
    required this.logoUrl,
    required this.storeCoverUrl,
    required this.storeGalleryUrls,
    required this.storeTagline,
    required this.storeDescription,
    required this.contactEmail,
    required this.contactPhone,
    required this.businessHours,
    required this.addressLine1,
    required this.addressLine2,
    required this.city,
    required this.state,
    required this.postcode,
    required this.countryCode,
    required this.currency,
    required this.timeZone,
    required this.standardShippingCents,
    required this.freeShippingThresholdCents,
    required this.deliveryPolicy,
    required this.returnsPolicy,
    required this.faqContent,
    required this.trustSafetyContent,
    required this.termsContent,
    required this.privacyContent,
    required this.instagramUrl,
    required this.facebookUrl,
    required this.tiktokUrl,
  });

  factory StaffStoreSettings.fromJson(Map<String, dynamic> json) {
    String text(String key, [String fallback = '']) =>
        json[key] is String ? json[key] as String : fallback;
    int number(String key) => json[key] is num ? (json[key] as num).toInt() : 0;

    return StaffStoreSettings(
      storeName: text('storeName', 'TextShop'),
      logoUrl: text('logoUrl'),
      storeCoverUrl: text('storeCoverUrl'),
      storeGalleryUrls:
          (json['storeGalleryUrls'] as List<dynamic>? ?? const <dynamic>[])
              .whereType<String>()
              .toList(),
      storeTagline: text('storeTagline'),
      storeDescription: text('storeDescription'),
      contactEmail: text('contactEmail'),
      contactPhone: text('contactPhone'),
      businessHours: text('businessHours'),
      addressLine1: text('addressLine1'),
      addressLine2: text('addressLine2'),
      city: text('city'),
      state: text('state'),
      postcode: text('postcode'),
      countryCode: text('countryCode', 'MY'),
      currency: text('currency', 'MYR'),
      timeZone: text('timeZone', 'Asia/Kuala_Lumpur'),
      standardShippingCents: number('standardShippingCents'),
      freeShippingThresholdCents: number('freeShippingThresholdCents'),
      deliveryPolicy: text('deliveryPolicy'),
      returnsPolicy: text('returnsPolicy'),
      faqContent: text('faqContent'),
      trustSafetyContent: text('trustSafetyContent'),
      termsContent: text('termsContent'),
      privacyContent: text('privacyContent'),
      instagramUrl: text('instagramUrl'),
      facebookUrl: text('facebookUrl'),
      tiktokUrl: text('tiktokUrl'),
    );
  }

  final String storeName;
  final String logoUrl;
  final String storeCoverUrl;
  final List<String> storeGalleryUrls;
  final String storeTagline;
  final String storeDescription;
  final String contactEmail;
  final String contactPhone;
  final String businessHours;
  final String addressLine1;
  final String addressLine2;
  final String city;
  final String state;
  final String postcode;
  final String countryCode;
  final String currency;
  final String timeZone;
  final int standardShippingCents;
  final int freeShippingThresholdCents;
  final String deliveryPolicy;
  final String returnsPolicy;
  final String faqContent;
  final String trustSafetyContent;
  final String termsContent;
  final String privacyContent;
  final String instagramUrl;
  final String facebookUrl;
  final String tiktokUrl;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'storeName': storeName,
        'logoUrl': logoUrl,
        'storeCoverUrl': storeCoverUrl,
        'storeGalleryUrls': storeGalleryUrls,
        'storeTagline': storeTagline,
        'storeDescription': storeDescription,
        'contactEmail': contactEmail,
        'contactPhone': contactPhone,
        'businessHours': businessHours,
        'addressLine1': addressLine1,
        'addressLine2': addressLine2,
        'city': city,
        'state': state,
        'postcode': postcode,
        'countryCode': countryCode,
        'currency': currency,
        'timeZone': timeZone,
        'standardShippingCents': standardShippingCents,
        'freeShippingThresholdCents': freeShippingThresholdCents,
        'deliveryPolicy': deliveryPolicy,
        'returnsPolicy': returnsPolicy,
        'faqContent': faqContent,
        'trustSafetyContent': trustSafetyContent,
        'termsContent': termsContent,
        'privacyContent': privacyContent,
        'instagramUrl': instagramUrl,
        'facebookUrl': facebookUrl,
        'tiktokUrl': tiktokUrl,
      };
}
