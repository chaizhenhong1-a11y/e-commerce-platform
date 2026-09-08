import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../domain/staff_store_settings.dart';
import '../domain/staff_store_location.dart';

class StaffStoreSettingsRepository {
  const StaffStoreSettingsRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<StaffStoreSettings> get() async {
    final response =
        await _apiClient.dio.get<Map<String, dynamic>>('/staff/settings');
    final data = response.data;
    if (data == null) {
      throw StateError('Store settings response was empty.');
    }
    return StaffStoreSettings.fromJson(data);
  }

  Future<String> uploadStorePhoto({
    required List<int> bytes,
    required String fileName,
  }) async {
    final form = FormData.fromMap(<String, dynamic>{
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
    });
    final response = await _apiClient.dio.post<Map<String, dynamic>>(
      '/staff/settings/media',
      data: form,
    );
    final url = response.data?['url'];
    if (url is! String || url.isEmpty) {
      throw StateError('Store photo upload returned no URL.');
    }
    return url;
  }

  Future<StaffStoreSettings> update(StaffStoreSettings settings) async {
    final response = await _apiClient.dio.patch<Map<String, dynamic>>(
      '/staff/settings',
      data: settings.toJson(),
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Updated store settings response was empty.');
    }
    return StaffStoreSettings.fromJson(data);
  }

  Future<List<StaffStoreLocation>> getLocations() async {
    final response =
        await _apiClient.dio.get<List<dynamic>>('/staff/settings/locations');
    return (response.data ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(StaffStoreLocation.fromJson)
        .toList();
  }

  Future<StaffStoreLocation> saveLocation(StaffStoreLocation location) async {
    final response = location.id.isEmpty
        ? await _apiClient.dio.post<Map<String, dynamic>>(
            '/staff/settings/locations',
            data: location.toJson())
        : await _apiClient.dio.patch<Map<String, dynamic>>(
            '/staff/settings/locations/${location.id}',
            data: location.toJson());
    final data = response.data;
    if (data == null) throw StateError('Store location response was empty.');
    return StaffStoreLocation.fromJson(data);
  }

  Future<void> deleteLocation(String id) async {
    await _apiClient.dio.delete<void>('/staff/settings/locations/$id');
  }
}
