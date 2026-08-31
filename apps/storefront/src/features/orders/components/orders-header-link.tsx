"use client";

import Link from "next/link";
import { HeaderActionIcon } from "@/shared/components/header-action-icon";

export function OrdersHeaderLink() {
  return (
    <Link
      href="/account/orders"
      className="header-action"
      aria-label="My orders"
      title="My orders"
    >
      <span className="header-action__icon" aria-hidden="true">
        <HeaderActionIcon name="orders" />
      </span>
      <span className="header-action__text">
        <small>Your</small>
        <strong>Purchases</strong>
      </span>
    </Link>
  );
}
