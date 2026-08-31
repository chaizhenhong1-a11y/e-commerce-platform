class CustomerAddress {
  const CustomerAddress({
    required this.id,
    required this.label,
    required this.recipientName,
    required this.phone,
    required this.line1,
    required this.city,
    required this.state,
    required this.postcode,
    required this.countryCode,
    required this.isDefault,
    this.line2,
  });

  factory CustomerAddress.fromJson(Map<String, dynamic> json) {
    return CustomerAddress(
      id: json['id'] as String,
      label: json['label'] as String,
      recipientName: json['recipientName'] as String,
      phone: json['phone'] as String,
      line1: json['line1'] as String,
      line2: json['line2'] as String?,
      city: json['city'] as String,
      state: json['state'] as String,
      postcode: json['postcode'] as String,
      countryCode: json['countryCode'] as String? ?? 'MY',
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }

  final String id;
  final String label;
  final String recipientName;
  final String phone;
  final String line1;
  final String? line2;
  final String city;
  final String state;
  final String postcode;
  final String countryCode;
  final bool isDefault;
}

class CustomerAddressInput {
  const CustomerAddressInput({
    required this.label,
    required this.recipientName,
    required this.phone,
    required this.line1,
    required this.city,
    required this.state,
    required this.postcode,
    this.line2,
    this.countryCode = 'MY',
    this.isDefault = false,
  });

  final String label;
  final String recipientName;
  final String phone;
  final String line1;
  final String? line2;
  final String city;
  final String state;
  final String postcode;
  final String countryCode;
  final bool isDefault;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'label': label.trim(),
      'recipientName': recipientName.trim(),
      'phone': phone.trim(),
      'line1': line1.trim(),
      if (line2?.trim().isNotEmpty ?? false) 'line2': line2!.trim(),
      'city': city.trim(),
      'state': state.trim(),
      'postcode': postcode.trim(),
      'countryCode': countryCode,
      'isDefault': isDefault,
    };
  }
}
