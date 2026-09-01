"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getWishlist,
  removeWishlistProduct,
  saveWishlistProduct,
} from "../data/wishlist-api";

type WishlistContextValue = {
  productIds: Set<string>;
  count: number;
  loading: boolean;
  authenticated: boolean | null;
  toggle: (productId: string) => Promise<"saved" | "removed" | "sign-in">;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const BACKGROUND_REFRESH_MS = 30_000;

function responseStatus(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }
  return null;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const refreshFlightRef = useRef<Promise<void> | null>(null);

  const sync = useCallback((showLoading: boolean) => {
    if (refreshFlightRef.current) {
      return refreshFlightRef.current;
    }

    if (showLoading) {
      setLoading(true);
    }

    const flight = (async () => {
      try {
        const snapshot = await getWishlist();
        setProductIds(new Set(snapshot.productIds));
        setAuthenticated(true);
      } catch (error) {
        if (responseStatus(error) === 401) {
          setProductIds(new Set());
          setAuthenticated(false);
        } else {
          console.error(error);
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    })();

    refreshFlightRef.current = flight;
    void flight.finally(() => {
      if (refreshFlightRef.current === flight) {
        refreshFlightRef.current = null;
      }
    });

    return flight;
  }, []);

  const refresh = useCallback(() => sync(true), [sync]);

  useEffect(() => {
    void sync(true);
  }, [sync]);

  useEffect(() => {
    const handleSignedOut = () => {
      setProductIds(new Set());
      setAuthenticated(false);
      setLoading(false);
    };

    window.addEventListener("textshop:auth-signed-out", handleSignedOut);
    return () => window.removeEventListener("textshop:auth-signed-out", handleSignedOut);
  }, []);

  useEffect(() => {
    const refreshInBackground = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      void sync(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sync(false);
      }
    };

    window.addEventListener("focus", refreshInBackground);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(
      refreshInBackground,
      BACKGROUND_REFRESH_MS,
    );

    return () => {
      window.removeEventListener("focus", refreshInBackground);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [sync]);

  const toggle = useCallback(
    async (productId: string) => {
      if (authenticated === false) {
        return "sign-in" as const;
      }

      const wasSaved = productIds.has(productId);
      const optimistic = new Set(productIds);
      if (wasSaved) {
        optimistic.delete(productId);
      } else {
        optimistic.add(productId);
      }
      setProductIds(optimistic);

      try {
        if (wasSaved) {
          await removeWishlistProduct(productId);
          setAuthenticated(true);
          return "removed" as const;
        }

        await saveWishlistProduct(productId);
        setAuthenticated(true);
        return "saved" as const;
      } catch (error) {
        setProductIds(productIds);
        if (responseStatus(error) === 401) {
          setAuthenticated(false);
          return "sign-in" as const;
        }
        throw error;
      }
    },
    [authenticated, productIds],
  );

  const value = useMemo(
    () => ({
      productIds,
      count: productIds.size,
      loading,
      authenticated,
      toggle,
      refresh,
    }),
    [authenticated, loading, productIds, refresh, toggle],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) {
    throw new Error("useWishlist must be used inside WishlistProvider.");
  }
  return value;
}
