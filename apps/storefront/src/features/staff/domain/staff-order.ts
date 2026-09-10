export type StaffOrder = {
  orderNumber: string; status: string; paymentStatus: string; email: string; customerName: string;
  currency: string; totalCents: number; createdAt: string; itemCount: number; canProcess: boolean; canShip: boolean; canDeliver: boolean; canFulfill: boolean;
  courierName: string | null; trackingNumber: string | null; trackingUrl: string | null;
  processingAt: string | null; shippedAt: string | null; deliveredAt: string | null;
  items: Array<{
    id: string;
    sku: string;
    productName: string;
    variantName: string;
    quantity: number;
    imageUrl: string | null;
    imageAltText: string | null;
  }>;
  latestRefund: { status: string; amountCents: number } | null;
  latestReturn: { id: string; status: string } | null;
};

export type StaffCommerceSummary = {
  currency: string;
  timeZone: string;
  totalOrders: number;
  awaitingPayment: number;
  readyToFulfill: number;
  fulfilled: number;
  activeReturns: number;
  refundProcessing: number;
  lowStockVariants: number;
  todayOrders: number;
  todayGrossSalesCents: number;
  todayRefundsCents: number;
  todayNetSalesCents: number;
  monthOrders: number;
  monthGrossSalesCents: number;
  monthRefundsCents: number;
  monthNetSalesCents: number;
  averageOrderValueCents: number;
};
