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
    }),
    [selectedVariant],
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
