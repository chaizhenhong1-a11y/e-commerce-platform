import type { Product } from "../domain/product";

export const mockProducts: Product[] = [
  {
    id: "prod_001",
    variantId: "mock_variant_001",
    slug: "everyday-canvas-tote",
    name: "Everyday Canvas Tote",
    description:
      "A clean everyday carry with a structured silhouette and roomy interior.",
    price: 69,
    currency: "MYR",
    category: "Bags",
    badge: "New",
    inStock: true,
    images: [
      {
        id: "mock_image_tote_main",
        url: "/products/canvas-tote-main.svg",
        altText: "Everyday Canvas Tote",
        isPrimary: true,
      },
      {
        id: "mock_image_tote_side",
        url: "/products/canvas-tote-side.svg",
        altText: "Everyday Canvas Tote side view",
        isPrimary: false,
      },
      {
        id: "mock_image_tote_detail",
        url: "/products/canvas-tote-detail.svg",
        altText: "Everyday Canvas Tote detail",
        isPrimary: false,
      },
    ],
    variants: [
    {
      id: "mock_variant_001",
      sku: "mock_variant_001",
      name: "Default",
      price: 69,
      currency: "MYR",
      availableStock: 999,
      inStock: true,
    },
  ],
},
  {
    id: "prod_002",
    variantId: "mock_variant_002",
    slug: "minimal-desk-lamp",
    name: "Minimal Desk Lamp",
    description:
      "Soft ambient light for workspaces, bedside tables, and reading corners.",
    price: 119,
    currency: "MYR",
    category: "Home",
    inStock: true,
    images: [
      {
        id: "mock_image_lamp_main",
        url: "/products/desk-lamp-main.svg",
        altText: "Minimal Desk Lamp",
        isPrimary: true,
      },
      {
        id: "mock_image_lamp_side",
        url: "/products/desk-lamp-side.svg",
        altText: "Minimal Desk Lamp side view",
        isPrimary: false,
      },
      {
        id: "mock_image_lamp_detail",
        url: "/products/desk-lamp-detail.svg",
        altText: "Minimal Desk Lamp detail",
        isPrimary: false,
      },
    ],
    variants: [
    {
      id: "mock_variant_002",
      sku: "mock_variant_002",
      name: "Default",
      price: 119,
      currency: "MYR",
      availableStock: 999,
      inStock: true,
    },
  ],
},
  {
    id: "prod_003",
    variantId: "mock_variant_003",
    slug: "daily-steel-bottle",
    name: "Daily Steel Bottle",
    description:
      "A durable insulated bottle designed for commuting and daily routines.",
    price: 49,
    currency: "MYR",
    category: "Lifestyle",
    badge: "Popular",
    inStock: true,
    images: [
      {
        id: "mock_image_bottle_main",
        url: "/products/steel-bottle-main.svg",
        altText: "Daily Steel Bottle",
        isPrimary: true,
      },
      {
        id: "mock_image_bottle_side",
        url: "/products/steel-bottle-side.svg",
        altText: "Daily Steel Bottle side view",
        isPrimary: false,
      },
      {
        id: "mock_image_bottle_detail",
        url: "/products/steel-bottle-detail.svg",
        altText: "Daily Steel Bottle detail",
        isPrimary: false,
      },
    ],
    variants: [
    {
      id: "mock_variant_003",
      sku: "mock_variant_003",
      name: "Default",
      price: 49,
      currency: "MYR",
      availableStock: 999,
      inStock: true,
    },
  ],
},];

export function getProductBySlug(slug: string) {
  return mockProducts.find((product) => product.slug === slug);
}
