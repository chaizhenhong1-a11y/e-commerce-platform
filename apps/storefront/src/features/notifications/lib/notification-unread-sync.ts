"use client";

const NOTIFICATION_UNREAD_COUNT_EVENT = "elvane:notifications:unread-count";

export function publishNotificationUnreadCount(count: number) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<number>(NOTIFICATION_UNREAD_COUNT_EVENT, {
      detail: Math.max(0, count),
    }),
  );
}

export function subscribeToNotificationUnreadCount(
  listener: (count: number) => void,
) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleUnreadCount = (event: Event) => {
    const customEvent = event as CustomEvent<number>;
    if (typeof customEvent.detail === "number") {
      listener(Math.max(0, customEvent.detail));
    }
  };

  window.addEventListener(
    NOTIFICATION_UNREAD_COUNT_EVENT,
    handleUnreadCount,
  );

  return () => {
    window.removeEventListener(
      NOTIFICATION_UNREAD_COUNT_EVENT,
      handleUnreadCount,
    );
  };
}
