class StaffStoreLocation {
  const StaffStoreLocation({
    required this.id,
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
    required this.isPrimary,
    required this.isActive,
    required this.sortOrder,
  });

  factory StaffStoreLocation.fromJson(Map<String, dynamic> json) =>
      StaffStoreLocation(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
        addressLine1: json['addressLine1'] as String? ?? '',
        addressLine2: json['addressLine2'] as String? ?? '',
        city: json['city'] as String? ?? '',
        state: json['state'] as String? ?? '',
        postcode: json['postcode'] as String? ?? '',
        countryCode: json['countryCode'] as String? ?? 'MY',
        phone: json['phone'] as String? ?? '',
        businessHours: json['businessHours'] as String? ?? '',
        description: json['description'] as String? ?? '',
        coverUrl: json['coverUrl'] as String? ?? '',
        galleryUrls:
            (json['galleryUrls'] as List<dynamic>? ?? const <dynamic>[])
                .whereType<String>()
                .toList(),
        isPrimary: json['isPrimary'] as bool? ?? false,
        isActive: json['isActive'] as bool? ?? true,
        sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      );

  final String id;
  final String name;
  final String addressLine1;
  final String addressLine2;
  final String city;
  final String state;
  final String postcode;
  final String countryCode;
  final String phone;
  final String businessHours;
  final String description;
  final String coverUrl;
  final List<String> galleryUrls;
  final bool isPrimary;
  final bool isActive;
  final int sortOrder;

  Map<String, dynamic> toJson() => <String, dynamic>{
        'name': name,
        'addressLine1': addressLine1,
        'addressLine2': addressLine2,
        'city': city,
        'state': state,
        'postcode': postcode,
        'countryCode': countryCode,
        'phone': phone,
        'businessHours': businessHours,
        'description': description,
        'coverUrl': coverUrl,
        'galleryUrls': galleryUrls,
        'isPrimary': isPrimary,
        'isActive': isActive,
        'sortOrder': sortOrder,
      };

  StaffStoreLocation copyWith({
    String? id,
    String? name,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? state,
    String? postcode,
    String? countryCode,
    String? phone,
    String? businessHours,
    String? description,
    String? coverUrl,
    List<String>? galleryUrls,
    bool? isPrimary,
    bool? isActive,
    int? sortOrder,
  }) =>
      StaffStoreLocation(
        id: id ?? this.id,
        name: name ?? this.name,
        addressLine1: addressLine1 ?? this.addressLine1,
        addressLine2: addressLine2 ?? this.addressLine2,
        city: city ?? this.city,
        state: state ?? this.state,
        postcode: postcode ?? this.postcode,
        countryCode: countryCode ?? this.countryCode,
        phone: phone ?? this.phone,
        businessHours: businessHours ?? this.businessHours,
        description: description ?? this.description,
        coverUrl: coverUrl ?? this.coverUrl,
        galleryUrls: galleryUrls ?? this.galleryUrls,
        isPrimary: isPrimary ?? this.isPrimary,
        isActive: isActive ?? this.isActive,
        sortOrder: sortOrder ?? this.sortOrder,
      );
}
