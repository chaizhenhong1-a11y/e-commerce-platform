import type { Product, ProductVariant } from "../domain/product";

type ApiInventory = {
  quantity: number;
  reserved: number;
};

type ApiVariant = {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  inventory: ApiInventory | null;
  optionValues?: Record<string, string> | null;
};

type ApiImage = {
  id: string;
  variantId: string | null;
  url: string;
  altText: string | null;
  isPrimary: boolean;
};

type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isFeatured: boolean;
  category: {
    name: string;
  } | null;
  images: ApiImage[];
  variants: ApiVariant[];
};

const apiBaseUrl =
  process.env.TEXTSHOP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

function toVariant(variant: ApiVariant): ProductVariant {
  const availableStock = Math.max(
    0,
    (variant.inventory?.quantity ?? 0) -
      (variant.inventory?.reserved ?? 0),
  );

  return {
    id: variant.id,
    sku: variant.sku,
    name: variant.name,
    price: variant.priceCents / 100,
    compareAtPrice:
      variant.compareAtCents == null ? undefined : variant.compareAtCents / 100,
    currency: "MYR",
    availableStock,
    inStock: availableStock > 0,
    optionValues:
      variant.optionValues && Object.keys(variant.optionValues).length > 0
        ? variant.optionValues
        : { Option: variant.name },
  };
}

function toProduct(product: ApiProduct): Product {
  const variants = product.variants.map(toVariant);
  const defaultVariant =
    variants.find((variant) => variant.inStock) ?? variants[0];

  return {
    id: product.id,
    variantId: defaultVariant?.id ?? "",
    slug: product.slug,
    name: product.name,
    description: product.description ?? "",
    price: defaultVariant?.price ?? 0,
    currency: "MYR",
    category: product.category?.name ?? "Uncategorized",
    badge: product.isFeatured ? "Featured" : undefined,
    inStock: variants.some((variant) => variant.inStock),
    images: product.images.map((image) => ({
      id: image.id,
      variantId: image.variantId ?? undefined,
      url: image.url,
      altText: image.altText ?? product.name,
      isPrimary: image.isPrimary,
    })),
    variants,
  };
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`TextShop API request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "name";

export type CatalogQuery = {
  query?: string;
  category?: string;
  sort?: CatalogSort;
};

export async function getProducts(
  filters: CatalogQuery = {},
): Promise<Product[]> {
  const search = new URLSearchParams();

  if (filters.query?.trim()) {
    search.set("q", filters.query.trim());
  }
  if (filters.category?.trim()) {
    search.set("category", filters.category.trim());
  }
  if (filters.sort && filters.sort !== "newest") {
    search.set("sort", filters.sort);
  }

  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  return (await request<ApiProduct[]>(`/products${suffix}`)).map(toProduct);
}

export async function getCategories(): Promise<string[]> {
  const categories = await request<Array<{ name: string }>>("/categories");
  return categories.map((category) => category.name);
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | null> {
  const response = await fetch(
    `${apiBaseUrl}/products/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`TextShop API request failed with ${response.status}.`);
  }

  return toProduct((await response.json()) as ApiProduct);
}
