class StoreLocation {
  const StoreLocation(
      {required this.id,
      required this.name,
      required this.addressLine1,
      required this.addressLine2,
      required this.city,
      required this.state,
      required this.postcode,
      required this.countryCode,
      required this.phone,
      required this.businessHours,
      required this.description,
      required this.coverUrl,
      required this.galleryUrls,
      required this.isPrimary});
  factory StoreLocation.fromJson(Map<String, dynamic> j) => StoreLocation(
      id: j['id'] as String? ?? '',
      name: j['name'] as String? ?? '',
      addressLine1: j['addressLine1'] as String? ?? '',
      addressLine2: j['addressLine2'] as String? ?? '',
      city: j['city'] as String? ?? '',
      state: j['state'] as String? ?? '',
      postcode: j['postcode'] as String? ?? '',
      countryCode: j['countryCode'] as String? ?? 'MY',
      phone: j['phone'] as String? ?? '',
      businessHours: j['businessHours'] as String? ?? '',
      description: j['description'] as String? ?? '',
      coverUrl: j['coverUrl'] as String? ?? '',
      galleryUrls: (j['galleryUrls'] as List<dynamic>? ?? const [])
          .whereType<String>()
          .toList(),
      isPrimary: j['isPrimary'] as bool? ?? false);
  final String id,
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      postcode,
      countryCode,
      phone,
      businessHours,
      description,
      coverUrl;
  final List<String> galleryUrls;
  final bool isPrimary;
  String get formattedAddress => [
        addressLine1,
        addressLine2,
        postcode,
        city,
        state,
        countryCode
      ].where((v) => v.trim().isNotEmpty).join(', ');
}

class StoreInfo {
  const StoreInfo({
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
    required this.standardShippingCents,
    required this.freeShippingThresholdCents,
    required this.estimatedDelivery,
    required this.deliveryPolicy,
    required this.returnWindowDays,
    required this.returnCondition,
    required this.refundMethod,
    required this.returnsPolicy,
    required this.faqContent,
    required this.trustSafetyContent,
    required this.termsContent,
    required this.privacyContent,
    required this.instagramUrl,
    required this.facebookUrl,
    required this.tiktokUrl,
    required this.locations,
  });

  factory StoreInfo.fromJson(Map<String, dynamic> json) {
    String text(String key, [String fallback = '']) =>
        json[key] is String ? json[key] as String : fallback;
    int number(String key) => json[key] is num ? (json[key] as num).toInt() : 0;

    return StoreInfo(
      storeName: text('storeName', 'Elvane'),
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
      standardShippingCents: number('standardShippingCents'),
      freeShippingThresholdCents: number('freeShippingThresholdCents'),
      estimatedDelivery: text('estimatedDelivery'),
      deliveryPolicy: text('deliveryPolicy'),
      returnWindowDays: number('returnWindowDays'),
      returnCondition: text('returnCondition'),
      refundMethod: text('refundMethod'),
      returnsPolicy: text('returnsPolicy'),
      faqContent: text('faqContent'),
      trustSafetyContent: text('trustSafetyContent'),
      termsContent: text('termsContent'),
      privacyContent: text('privacyContent'),
      instagramUrl: text('instagramUrl'),
      facebookUrl: text('facebookUrl'),
      tiktokUrl: text('tiktokUrl'),
      locations: (json['locations'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(StoreLocation.fromJson)
          .toList(),
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
  final int standardShippingCents;
  final int freeShippingThresholdCents;
  final String estimatedDelivery;
  final String deliveryPolicy;
  final int returnWindowDays;
  final String returnCondition;
  final String refundMethod;
  final String returnsPolicy;
  final String faqContent;
  final String trustSafetyContent;
  final String termsContent;
  final String privacyContent;
  final String instagramUrl;
  final String facebookUrl;
  final String tiktokUrl;
  final List<StoreLocation> locations;

  String get formattedAddress => <String>[
        addressLine1,
        addressLine2,
        postcode,
        city,
        state,
        countryCode,
      ].where((value) => value.trim().isNotEmpty).join(', ');
}
