"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWishlist } from "@/features/wishlist/components/wishlist-provider";

type WishlistButtonProps = {
  productId: string;
  productName: string;
  variant?: "card" | "detail";
};

export function WishlistButton({
  productId,
  productName,
  variant = "card",
}: WishlistButtonProps) {
  const router = useRouter();
  const { productIds, toggle } = useWishlist();
  const [pending, setPending] = useState(false);
  const saved = productIds.has(productId);

  async function onToggle() {
    if (pending) return;
    setPending(true);

    try {
      const result = await toggle(productId);
      if (result === "sign-in") {
        router.push("/account/sign-in");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPending(false);
    }
  }

  if (variant === "detail") {
    return (
      <button
        className={`product-wishlist-action${saved ? " product-wishlist-action--saved" : ""}`}
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={saved}
      >
        <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
        {pending
          ? "Updating…"
          : saved
            ? "Saved to wishlist"
            : "Save to wishlist"}
      </button>
    );
  }

  return (
    <button
      className={`wishlist-button${saved ? " wishlist-button--saved" : ""}`}
      type="button"
      onClick={onToggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${productName} ${saved ? "from" : "to"} wishlist`}
      title={saved ? "Remove from wishlist" : "Save to wishlist"}
    >
      <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
    </button>
  );
}
