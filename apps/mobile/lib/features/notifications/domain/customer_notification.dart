class CustomerNotification {
  const CustomerNotification({required this.id,required this.type,required this.title,required this.message,required this.createdAt,this.orderNumber,this.actionPath,this.readAt});
  factory CustomerNotification.fromJson(Map<String,dynamic> json)=>CustomerNotification(id:json['id'] as String,type:json['type'] as String,title:json['title'] as String,message:json['message'] as String,orderNumber:json['orderNumber'] as String?,actionPath:json['actionPath'] as String?,readAt:json['readAt'] == null ? null : DateTime.parse(json['readAt'] as String),createdAt:DateTime.parse(json['createdAt'] as String));
  final String id,type,title,message; final String? orderNumber,actionPath; final DateTime? readAt; final DateTime createdAt;
  bool get isUnread=>readAt==null;
}
class NotificationFeed { const NotificationFeed({required this.unreadCount,required this.items}); factory NotificationFeed.fromJson(Map<String,dynamic> json)=>NotificationFeed(unreadCount:json['unreadCount'] as int? ?? 0,items:(json['items'] as List<dynamic>? ?? const []).map((e)=>CustomerNotification.fromJson(e as Map<String,dynamic>)).toList()); final int unreadCount; final List<CustomerNotification> items; }
