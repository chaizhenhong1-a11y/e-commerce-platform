"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { NotificationFeed } from "../domain/notification";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../data/notification-api";
import { publishNotificationUnreadCount } from "../lib/notification-unread-sync";
import {
  accountRouteCacheKeys,
  markAccountSignedIn,
  markAccountSignedOut,
  readAccountAuthState,
  readAccountRouteCache,
  writeAccountRouteCache,
} from "@/features/account/lib/account-route-cache";

export function NotificationCenter() {
  const cachedFeed = readAccountRouteCache<NotificationFeed>(
    accountRouteCacheKeys.notifications,
  );
  const [feed, setFeed] = useState<NotificationFeed | null>(cachedFeed ?? null);
  const initialAuthState = readAccountAuthState();
  const [loading, setLoading] = useState(!cachedFeed && initialAuthState !== "signed-out");

  const load = useCallback(async () => {
    try {
      const nextFeed = await getNotifications();
      if (nextFeed) {
        markAccountSignedIn();
        setFeed(nextFeed);
        writeAccountRouteCache<NotificationFeed>(
          accountRouteCacheKeys.notifications,
          nextFeed,
        );
      } else {
        markAccountSignedOut();
        setFeed(null);
      }
      publishNotificationUnreadCount(nextFeed?.unreadCount ?? 0);
      return nextFeed;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (readAccountAuthState() === "signed-out") return;
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="shell notification-center">
        <p>Loading updates…</p>
      </div>
    );
  }

  if (!feed) {
    return (
      <section className="shell commerce-guest-page commerce-guest-page--updates">
        <div className="commerce-guest-card">
          <div className="commerce-guest-card__content">
            <span className="commerce-guest-card__kicker">UPDATES</span>
            <h1>Sign in to see account updates.</h1>
            <p>Order, delivery, return and refund activity stays connected to your TextShop account.</p>
            <Link
              className="button button--primary"
              href="/account/sign-in?returnTo=%2Fnotifications"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="shell notification-center">
      <div className="notification-center__head">
        <div>
          <p className="eyebrow">Account activity</p>
          <h1>Updates</h1>
          <p>{feed.unreadCount} unread</p>
        </div>

        {feed.unreadCount > 0 && (
          <button
            className="button"
            onClick={async () => {
              await markAllNotificationsRead();
              await load();
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {feed.items.length === 0 ? (
        <div className="notification-empty">
          <h2>You’re all caught up</h2>
          <p>Order, delivery, return and refund updates will appear here.</p>
        </div>
      ) : (
        <div className="notification-list">
          {feed.items.map((notification) => (
            <article
              key={notification.id}
              className={`notification-card ${
                notification.readAt ? "" : "notification-card--unread"
              }`}
            >
              <div>
                <small>
                  {notification.type} ·{" "}
                  {new Date(notification.createdAt).toLocaleString()}
                </small>
                <h2>{notification.title}</h2>
                <p>{notification.message}</p>
              </div>

              <div className="notification-card__actions">
                {notification.actionPath && (
                  <Link
                    className="button"
                    href={notification.actionPath}
                    onClick={() => {
                      if (notification.readAt) return;

                      void markNotificationRead(notification.id)
                        .then(() => {
                          publishNotificationUnreadCount(
                            Math.max(0, feed.unreadCount - 1),
                          );
                        })
                        .catch(() => {});
                    }}
                  >
                    View
                  </Link>
                )}

                {!notification.readAt && (
                  <button
                    className="button"
                    onClick={async () => {
                      await markNotificationRead(notification.id);
                      await load();
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
