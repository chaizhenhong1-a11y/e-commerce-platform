export type CustomerNotification = { id: string; type: "ORDER"|"PAYMENT"|"SHIPPING"|"RETURN"|"REFUND"|"ACCOUNT"; title: string; message: string; orderNumber: string|null; actionPath: string|null; readAt: string|null; createdAt: string };
export type NotificationFeed = { unreadCount: number; items: CustomerNotification[] };
