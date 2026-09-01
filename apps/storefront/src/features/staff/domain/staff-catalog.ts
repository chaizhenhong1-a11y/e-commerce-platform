export type StaffInventory = { id: string; quantity: number; reserved: number } | null;
export type StaffCategory = { id: string; name: string; slug: string };
export type StaffImage = {
  id: string;
  url: string;
  altText: string | null;
  variantId: string | null;
  sortOrder: number;
  isPrimary: boolean;
};
export type StaffVariant = {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  isActive: boolean;
  optionValues?: Record<string, string> | null;
  inventory: StaffInventory;
};
export type StaffProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  category: { id: string; name: string } | null;
  categoryId?: string | null;
  images?: StaffImage[];
  variants: StaffVariant[];
  updatedAt: string;
};
export type StaffInventoryAdjustment = {
  id: string;
  delta: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  createdAt: string;
  actor: { id: string; email: string; firstName: string; lastName: string };
};
