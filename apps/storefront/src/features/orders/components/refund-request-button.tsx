"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefundRequestButton({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function requestRefund() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "CHANGED_MIND" }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(body?.message || "Unable to request refund.");
      setConfirming(false); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to request refund.");
    } finally { setBusy(false); }
  }

  if (!confirming) {
    return <button className="button" type="button" onClick={() => setConfirming(true)}>Request refund</button>;
  }

  return (
    <div className="order-cancel-confirm">
      <strong>Refund the full order?</strong>
      <span>RM funds will be returned through the original payment provider. Inventory is not automatically restocked.</span>
      {error ? <p>{error}</p> : null}
      <div>
        <button className="button" type="button" disabled={busy} onClick={() => setConfirming(false)}>Keep order</button>
        <button className="button order-cancel-button" type="button" disabled={busy} onClick={requestRefund}>{busy ? "Submitting…" : "Confirm refund"}</button>
      </div>
    </div>
  );
}
