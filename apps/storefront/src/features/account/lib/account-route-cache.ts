"use client";

const cache = new Map<string, unknown>();
let resetListenerInstalled = false;
let authState: "unknown" | "signed-in" | "signed-out" = "unknown";

function installResetListener() {
  if (resetListenerInstalled || typeof window === "undefined") return;
  resetListenerInstalled = true;
  window.addEventListener("elvane:auth-signed-out", () => {
    authState = "signed-out";
    clearAccountRouteCache();
  });
  window.addEventListener("elvane:auth-signed-in", () => {
    authState = "signed-in";
  });
}

export const accountRouteCacheKeys = {
  dashboard: "account:dashboard",
  orders: "account:orders",
  cart: "account:cart",
  notifications: "account:notifications",
} as const;

export function readAccountAuthState() {
  installResetListener();
  return authState;
}

export function markAccountSignedOut() {
  installResetListener();
  authState = "signed-out";
  cache.clear();
}

export function markAccountSignedIn() {
  installResetListener();
  authState = "signed-in";
}

export function readAccountRouteCache<T>(key: string): T | undefined {
  installResetListener();
  return cache.get(key) as T | undefined;
}

export function writeAccountRouteCache<T>(key: string, value: T) {
  installResetListener();
  authState = "signed-in";
  cache.set(key, value);
}

export function deleteAccountRouteCache(key: string) {
  installResetListener();
  cache.delete(key);
}

export function clearAccountRouteCache() {
  cache.clear();
}
