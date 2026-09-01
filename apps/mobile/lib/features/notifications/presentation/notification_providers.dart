import '../data/push_registration_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; import '../../auth/presentation/auth_providers.dart'; import '../data/notifications_repository.dart'; import '../domain/customer_notification.dart';
final notificationsRepositoryProvider=Provider((ref)=>NotificationsRepository(ref.watch(apiClientProvider)));
final notificationFeedProvider=FutureProvider<NotificationFeed>((ref) async {if(!ref.watch(authControllerProvider).isAuthenticated)return const NotificationFeed(unreadCount:0,items:[]); return ref.watch(notificationsRepositoryProvider).list();});

final pushRegistrationServiceProvider = Provider((ref) => PushRegistrationService(ref.watch(apiClientProvider)));
