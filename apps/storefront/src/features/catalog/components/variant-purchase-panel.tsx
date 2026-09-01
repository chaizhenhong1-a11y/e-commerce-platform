"use client";

import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import type { ProductVariant } from "../domain/product";
import { useProductSelection } from "./product-selection-provider";

type VariantPurchasePanelProps = { variants: ProductVariant[] };

function money(value: number) {
  return `RM ${value.toFixed(2)}`;
}

export function VariantPurchasePanel({ variants }: VariantPurchasePanelProps) {
  const { selectedVariant, selectOption } = useProductSelection();

  if (!selectedVariant) {
    return <div className="product-buy-panel"><div className="product-stock-state"><span className="stock-dot stock-dot--out" />Currently unavailable</div><AddToCartButton variantId="" disabled /></div>;
  }

  const optionNames = Array.from(new Set(variants.flatMap((variant) => Object.keys(variant.optionValues))));

  return (
    <>
      <div className="product-price-row">
        <div className="product-price-stack">
          <strong>{money(selectedVariant.price)}</strong>
          {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price ? <del>{money(selectedVariant.compareAtPrice)}</del> : null}
        </div>
        <span>Tax included</span>
      </div>

      {optionNames.map((optionName, optionIndex) => {
        const values = Array.from(new Set(variants.map((variant) => variant.optionValues[optionName]).filter(Boolean)));
        return (
          <div className="product-option-block" key={optionName}>
            <div className="product-option-heading"><strong>{optionName}</strong><span>{selectedVariant.optionValues[optionName] ?? ""}</span></div>
            <div className="product-option-list" role="radiogroup" aria-label={optionName}>
              {values.map((value) => {
                const selected = selectedVariant.optionValues[optionName] === value;
                const available = variants.some((variant) => {
                  if (!variant.inStock || variant.optionValues[optionName] !== value) return false;
                  return optionNames.slice(0, optionIndex).every((name) => variant.optionValues[name] === selectedVariant.optionValues[name]);
                });
                return (
                  <button className={["product-option", selected ? "product-option--selected" : "", available ? "" : "product-option--disabled"].filter(Boolean).join(" ")} type="button" role="radio" aria-checked={selected} aria-disabled={!available} disabled={!available} key={value} onClick={() => selectOption(optionName, value)}>
                    <span>{value}</span>
                    <small>{available ? "Available" : "Unavailable"}</small>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="product-buy-panel">
        <div className="product-stock-state"><span className={selectedVariant.inStock ? "stock-dot" : "stock-dot stock-dot--out"} />{selectedVariant.inStock ? `${selectedVariant.availableStock} available · ${selectedVariant.sku}` : `Out of stock · ${selectedVariant.sku}`}</div>
        <AddToCartButton variantId={selectedVariant.id} disabled={!selectedVariant.inStock} />
      </div>
    </>
  );
}
