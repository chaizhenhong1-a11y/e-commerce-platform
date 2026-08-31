import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/customer_address.dart';

class CustomerRepository {
  CustomerRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<CustomerAddress>> getAddresses() async {
    final response =
        await _apiClient.dio.get<List<dynamic>>('/customers/me/addresses');
    final data = response.data ?? const <dynamic>[];
    return data
        .map((item) => CustomerAddress.fromJson(
              item as Map<String, dynamic>,
            ))
        .toList(growable: false);
  }

  Future<CustomerAddress> createAddress(
    CustomerAddressInput input,
  ) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/customers/me/addresses',
      data: input.toJson(),
    );
    return _readAddress(response);
  }

  Future<CustomerAddress> updateAddress(
    String id,
    CustomerAddressInput input,
  ) async {
    final response = await _apiClient.dio.patch<Map<String, dynamic>>(
      '/customers/me/addresses/$id',
      data: input.toJson(),
    );
    return _readAddress(response);
  }

  Future<CustomerAddress> setDefaultAddress(String id) async {
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/customers/me/addresses/$id/default',
    );
    return _readAddress(response);
  }

  Future<void> deleteAddress(String id) async {
    await _apiClient.dio.delete<void>(
      '/customers/me/addresses/$id',
    );
  }

  CustomerAddress _readAddress(
    Response<Map<String, dynamic>> response,
  ) {
    final data = response.data;
    if (data == null) {
      throw StateError('Address response was empty.');
    }
    return CustomerAddress.fromJson(data);
  }
}
