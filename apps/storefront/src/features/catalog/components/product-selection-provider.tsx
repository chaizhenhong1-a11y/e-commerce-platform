"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ProductVariant } from "../domain/product";

type ProductSelectionContextValue = {
  selectedVariant: ProductVariant | null;
  selectVariant: (variantId: string) => void;
  selectOption: (optionName: string, value: string) => void;
};

const ProductSelectionContext =
  createContext<ProductSelectionContextValue | null>(null);

export function ProductSelectionProvider({
  variants,
  children,
}: {
  variants: ProductVariant[];
  children: ReactNode;
}) {
  const initialVariantId =
    variants.find((variant) => variant.inStock)?.id ?? variants[0]?.id ?? "";
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId);

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    variants[0] ??
    null;

  const value = useMemo(
    () => ({
      selectedVariant,
      selectVariant: setSelectedVariantId,
      selectOption: (optionName: string, optionValue: string) => {
        const current = selectedVariant?.optionValues ?? {};
        const exact = variants.find((variant) => {
          if (!variant.inStock || variant.optionValues[optionName] !== optionValue) return false;
          return Object.entries(current).every(([name, value]) =>
            name === optionName ? true : variant.optionValues[name] === value,
          );
        });
        const fallback = variants.find(
          (variant) =>
            variant.optionValues[optionName] === optionValue && variant.inStock,
        );
        const candidate = exact ?? fallback ?? variants.find(
          (variant) => variant.optionValues[optionName] === optionValue,
        );
        if (candidate) setSelectedVariantId(candidate.id);
      },
    }),
    [selectedVariant, variants],
  );

  return (
    <ProductSelectionContext.Provider value={value}>
      {children}
    </ProductSelectionContext.Provider>
  );
}

export function useProductSelection() {
  const value = useContext(ProductSelectionContext);
  if (!value) {
    throw new Error(
      "useProductSelection must be used inside ProductSelectionProvider.",
    );
  }
  return value;
}
