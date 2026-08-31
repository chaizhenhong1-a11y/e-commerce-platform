"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "../data/cart-api";
import { getCartSessionId } from "../data/cart-session";

type AddToCartButtonProps = {
  variantId: string;
  disabled?: boolean;
};

export function AddToCartButton({
  variantId,
  disabled = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<
    "idle" | "adding" | "added" | "error"
  >("idle");
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!variantId || disabled || state === "adding") {
      return;
    }

    setState("adding");
    setError("");

    try {
      const sessionId = getCartSessionId();
      await addCartItem(sessionId, variantId, 1);
      setState("added");
      router.push("/cart");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to add item.",
      );
      setState("error");
    }
  }

  return (
    <div className="add-to-cart">
      <button
        className="button button--primary"
        type="button"
        disabled={disabled || !variantId || state === "adding"}
        onClick={handleAdd}
      >
        {state === "adding"
          ? "Adding…"
          : state === "added"
            ? "Added"
            : "Add to cart"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
