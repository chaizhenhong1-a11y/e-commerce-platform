"use client";

import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import type { ProductVariant } from "../domain/product";
import { useProductSelection } from "./product-selection-provider";

type VariantPurchasePanelProps = {
  variants: ProductVariant[];
};

function money(value: number) {
  return `RM ${value.toFixed(2)}`;
}

export function VariantPurchasePanel({
  variants,
}: VariantPurchasePanelProps) {
  const { selectedVariant, selectVariant } = useProductSelection();

  if (!selectedVariant) {
    return (
      <div className="product-buy-panel">
        <div className="product-stock-state">
          <span className="stock-dot stock-dot--out" />
          Currently unavailable
        </div>
        <AddToCartButton variantId="" disabled />
      </div>
    );
  }

  return (
    <>
      <div className="product-price-row">
        <div className="product-price-stack">
          <strong>{money(selectedVariant.price)}</strong>
          {selectedVariant.compareAtPrice &&
          selectedVariant.compareAtPrice > selectedVariant.price ? (
            <del>{money(selectedVariant.compareAtPrice)}</del>
          ) : null}
        </div>
        <span>Tax included</span>
      </div>

      <div className="product-option-block">
        <div className="product-option-heading">
          <strong>{variants.length > 1 ? "Choose option" : "Option"}</strong>
          <span>{selectedVariant.name}</span>
        </div>

        <div className="product-option-list" role="radiogroup" aria-label="Product option">
          {variants.map((variant) => {
            const selected = variant.id === selectedVariant.id;
            return (
              <button
                className={[
                  "product-option",
                  selected ? "product-option--selected" : "",
                  variant.inStock ? "" : "product-option--disabled",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-disabled={!variant.inStock}
                disabled={!variant.inStock}
                key={variant.id}
                onClick={() => selectVariant(variant.id)}
              >
                <span>{variant.name}</span>
                <small>
                  {variant.inStock
                    ? `${money(variant.price)} · ${variant.availableStock} left`
                    : "Out of stock"}
                </small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="product-buy-panel">
        <div className="product-stock-state">
          <span
            className={
              selectedVariant.inStock
                ? "stock-dot"
                : "stock-dot stock-dot--out"
            }
          />
          {selectedVariant.inStock
            ? `${selectedVariant.availableStock} available · ${selectedVariant.sku}`
            : `Out of stock · ${selectedVariant.sku}`}
        </div>

        <AddToCartButton
          variantId={selectedVariant.id}
          disabled={!selectedVariant.inStock}
        />
      </div>
    </>
  );
}
