export type StaffReturnItem = {
  id: string;
  quantity: number;
  condition: "UNOPENED" | "OPENED" | "DAMAGED" | "DEFECTIVE" | null;
  disposition: "RESTOCK" | "QUARANTINE" | "DISCARD" | null;
  inspectedAt: string | null;
  restockedAt: string | null;
  orderItem: {
    id: string;
    sku: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPriceCents: number;
  };
};

export type StaffReturnCase = {
  id: string;
  status:
    | "REQUESTED"
    | "APPROVED"
    | "IN_TRANSIT"
    | "RECEIVED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED";
  reason: string;
  customerNote: string | null;
  staffNote: string | null;
  requestedAt: string;
  approvedAt: string | null;
  receivedAt: string | null;
  completedAt: string | null;
  order: {
    orderNumber: string;
    email: string;
    currency: string;
    totalCents: number;
    paymentStatus:
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "PARTIALLY_REFUNDED"
      | "REFUNDED";
    createdAt: string;
  };
  items: StaffReturnItem[];
  refund: {
    id: string;
    status: "REQUESTED" | "PROCESSING" | "REFUNDED" | "REJECTED" | "FAILED";
    amountCents: number;
    currency: string;
  } | null;
};
