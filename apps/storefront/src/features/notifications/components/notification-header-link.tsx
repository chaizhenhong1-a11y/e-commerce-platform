"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNotifications } from "../data/notification-api";
import { subscribeToNotificationUnreadCount } from "../lib/notification-unread-sync";

export function NotificationHeaderLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let live = true;

    const load = () =>
      getNotifications()
        .then((feed) => {
          if (live) {
            setCount(feed?.unreadCount ?? 0);
          }
        })
        .catch(() => {});

    void load();

    const unsubscribe = subscribeToNotificationUnreadCount((nextCount) => {
      if (live) {
        setCount(nextCount);
      }
    });

    const intervalId = window.setInterval(load, 30_000);
    const handleFocus = () => {
      void load();
    };
    const handleSignedOut = () => {
      setCount(0);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("textshop:auth-signed-out", handleSignedOut);

    return () => {
      live = false;
      unsubscribe();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("textshop:auth-signed-out", handleSignedOut);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      className="header-action"
      aria-label={`${count} unread notifications`}
    >
      <span
        className="header-action__icon notification-bell"
        aria-hidden="true"
      >
        ♢
        {count > 0 && <b>{count > 99 ? "99+" : count}</b>}
      </span>
      <span className="header-action__text">
        <small>Your</small>
        <strong>Updates</strong>
      </span>
    </Link>
  );
}
