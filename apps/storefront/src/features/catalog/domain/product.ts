export type ProductImage = {
  id: string;
  variantId?: string;
  url: string;
  altText: string;
  isPrimary: boolean;
};

export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  currency: "MYR";
  availableStock: number;
  inStock: boolean;
  optionValues: Record<string, string>;
};

export type ProductDetails = {
  material?: string;
  dimensions?: string;
  care?: string;
  highlights: string[];
  specifications: Record<string, string>;
};

export type Product = {
  id: string;
  variantId: string;
  slug: string;
  name: string;
  description: string;
  details: ProductDetails;
  colorSwatches: Record<string, string>;
  price: number;
  currency: "MYR";
  category: string;
  badge?: string;
  inStock: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
};
