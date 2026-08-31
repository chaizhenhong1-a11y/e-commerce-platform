"use client";

import Link from "next/link";
import { useWishlist } from "@/features/wishlist/components/wishlist-provider";
import { HeaderActionIcon } from "@/shared/components/header-action-icon";

export function WishlistHeaderLink() {
  const { count } = useWishlist();

  return (
    <Link href="/wishlist" className="header-action">
      <span className="header-action__icon header-wishlist-icon" aria-hidden="true">
        <HeaderActionIcon name="wishlist" />
        {count > 0 ? (
          <span className="header-wishlist-count">{count > 99 ? "99+" : count}</span>
        ) : null}
      </span>
      <span className="header-action__text">
        <small>{count > 0 ? `${count} saved` : "Saved"}</small>
        <strong>Wishlist</strong>
      </span>
    </Link>
  );
}
