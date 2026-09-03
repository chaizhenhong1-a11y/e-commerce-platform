export type StaffOrder = {
  orderNumber: string; status: string; paymentStatus: string; email: string; customerName: string;
  currency: string; totalCents: number; createdAt: string; itemCount: number; canProcess: boolean; canShip: boolean; canDeliver: boolean; canFulfill: boolean;
  courierName: string | null; trackingNumber: string | null; trackingUrl: string | null;
  processingAt: string | null; shippedAt: string | null; deliveredAt: string | null;
  items: Array<{ id: string; sku: string; productName: string; variantName: string; quantity: number }>;
  latestRefund: { status: string; amountCents: number } | null;
  latestReturn: { id: string; status: string } | null;
};
export type StaffCommerceSummary = {
  totalOrders: number; awaitingPayment: number; readyToFulfill: number; fulfilled: number;
  activeReturns: number; refundProcessing: number; lowStockVariants: number;
};
