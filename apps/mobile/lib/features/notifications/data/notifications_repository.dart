import '../../../core/network/api_client.dart';
import '../domain/customer_notification.dart';

class NotificationsRepository {
  NotificationsRepository(this._api);
  final ApiClient _api;
  Future<NotificationFeed> list() async {
    final r = await _api.dio.get<Map<String, dynamic>>('/notifications');
    return NotificationFeed.fromJson(r.data ?? const {});
  }

  Future<void> markRead(String id) =>
      _api.dio.post<void>('/notifications/$id/read');
  Future<void> markAllRead() => _api.dio.post<void>('/notifications/read-all');
}
