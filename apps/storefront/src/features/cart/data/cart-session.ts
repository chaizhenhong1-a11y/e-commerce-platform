const CART_SESSION_KEY = "textshop.cart.session";

export function getCartSessionId(): string {
  const existing = window.localStorage.getItem(CART_SESSION_KEY);

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(CART_SESSION_KEY, sessionId);
  return sessionId;
}

export function resetCartSession(): void {
  window.localStorage.removeItem(CART_SESSION_KEY);
}
