"use client";

import type { CSSProperties } from "react";
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import type { ProductVariant } from "../domain/product";
import { useProductSelection } from "./product-selection-provider";

type VariantPurchasePanelProps = { variants: ProductVariant[]; colorSwatches?: Record<string, string> };

function money(value: number) {
  return `RM ${value.toFixed(2)}`;
}

export function VariantPurchasePanel({ variants, colorSwatches = {} }: VariantPurchasePanelProps) {
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
                  <button className={["product-option", /^colou?r$/i.test(optionName) && colorSwatches[value] ? "product-option--color" : "", selected ? "product-option--selected" : "", available ? "" : "product-option--disabled"].filter(Boolean).join(" ")} type="button" role="radio" aria-checked={selected} aria-disabled={!available} disabled={!available} key={value} onClick={() => selectOption(optionName, value)}>
                    {/^colou?r$/i.test(optionName) && colorSwatches[value] ? <span className="product-color-swatch" style={{ "--swatch-color": colorSwatches[value] } as CSSProperties} aria-hidden="true" /> : null}
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
        <div className="product-stock-state"><span className={selectedVariant.inStock ? "stock-dot" : "stock-dot stock-dot--out"} />{!selectedVariant.inStock ? "Out of stock" : selectedVariant.availableStock <= 5 ? `Only ${selectedVariant.availableStock} left` : "In stock"}</div>
        <AddToCartButton variantId={selectedVariant.id} disabled={!selectedVariant.inStock} />
      </div>
    </>
  );
}
