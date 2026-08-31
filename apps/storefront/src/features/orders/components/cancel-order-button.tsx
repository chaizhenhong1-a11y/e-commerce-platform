"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelOrderButton({
  orderNumber,
  onCancelled,
}: {
  orderNumber: string;
  onCancelled?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}/cancel`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.message || "Unable to cancel order.");
      }

      setConfirming(false);
      if (onCancelled) {
        await onCancelled();
      } else {
        router.refresh();
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to cancel order.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        className="button order-cancel-button"
        type="button"
        onClick={() => setConfirming(true)}
      >
        Cancel order
      </button>
    );
  }

  return (
    <div className="order-cancel-confirm">
      <strong>Cancel this unpaid order?</strong>
      <span>
        Its reserved inventory will be released immediately.
      </span>
      {error ? <p>{error}</p> : null}
      <div>
        <button
          className="button"
          type="button"
          disabled={busy}
          onClick={() => setConfirming(false)}
        >
          Keep order
        </button>
        <button
          className="button order-cancel-button"
          type="button"
          disabled={busy}
          onClick={cancel}
        >
          {busy ? "Cancelling…" : "Yes, cancel order"}
        </button>
      </div>
    </div>
  );
}
