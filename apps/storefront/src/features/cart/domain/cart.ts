export type CartItem = {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  slug: string;
  imageUrl?: string;
  quantity: number;
  price: number;
  currency: string;
  availableStock: number;
  productActive: boolean;
  variantActive: boolean;
  issue?: string;
};

export type Cart = {
  id: string;
  sessionId: string;
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
  canCheckout: boolean;
  issueCount: number;
};
