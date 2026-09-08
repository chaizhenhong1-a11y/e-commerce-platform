import '../../../core/network/api_client.dart';
import '../domain/store_info.dart';

class StoreInfoRepository {
  const StoreInfoRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<StoreInfo> get() async {
    final response =
        await _apiClient.dio.get<Map<String, dynamic>>('/store-info');
    final data = response.data;
    if (data == null) throw StateError('Store information response was empty.');
    return StoreInfo.fromJson(data);
  }
}
