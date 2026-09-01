"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ReturnableItem = {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
};

type ReturnReason =
  | "DAMAGED"
  | "DEFECTIVE"
  | "WRONG_ITEM"
  | "NOT_AS_DESCRIBED"
  | "CHANGED_MIND"
  | "OTHER";

export function ReturnRequestButton({
  orderNumber,
  items,
}: {
  orderNumber: string;
  items: ReturnableItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<ReturnReason>("CHANGED_MIND");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.map((item) => item.id)),
  );

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(item.id)),
    [items, selected],
  );

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (selectedItems.length === 0) {
      setError("Select at least one item to return.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}/returns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason,
            items: selectedItems.map((item) => ({
              orderItemId: item.id,
              quantity: item.quantity,
            })),
          }),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      if (!response.ok) {
        throw new Error(body?.message || "Unable to request return.");
      }
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to request return.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="button" type="button" onClick={() => setOpen(true)}>
        Start return
      </button>
    );
  }

  return (
    <div className="order-cancel-confirm">
      <strong>Select items to return</strong>
      <span>
        A return request does not immediately refund money or put inventory back
        into stock.
      </span>

      <label>
        Reason
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value as ReturnReason)}
          disabled={busy}
        >
          <option value="CHANGED_MIND">Changed my mind</option>
          <option value="DAMAGED">Arrived damaged</option>
          <option value="DEFECTIVE">Defective item</option>
          <option value="WRONG_ITEM">Wrong item received</option>
          <option value="NOT_AS_DESCRIBED">Not as described</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <div>
        {items.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              disabled={busy}
            />{" "}
            {item.productName} · {item.variantName} · {item.sku} · Qty {item.quantity}
          </label>
        ))}
      </div>

      {error ? <p>{error}</p> : null}
      <div>
        <button
          className="button"
          type="button"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Keep order
        </button>
        <button
          className="button button--primary"
          type="button"
          disabled={busy || selectedItems.length === 0}
          onClick={submit}
        >
          {busy ? "Submitting…" : "Submit return"}
        </button>
      </div>
    </div>
  );
}
