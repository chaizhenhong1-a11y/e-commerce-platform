import { PaymentView } from "@/features/payment/components/payment-view";
import { getOrderStatus } from "@/features/orders/data/order-api";

export const metadata = { title: "Payment" };

type PaymentPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const { order: orderNumber } = await searchParams;

  if (!orderNumber) {
    return (
      <div className="shell checkout-page">
        <div className="empty-cart-card">
          <h2>Missing order</h2>
          <p>A valid order number is required to continue payment.</p>
        </div>
      </div>
    );
  }

  try {
    const order = await getOrderStatus(orderNumber);
    return (
      <div className="shell checkout-page">
        <PaymentView initialOrder={order} />
      </div>
    );
  } catch (error) {
    return (
      <div className="shell checkout-page">
        <div className="empty-cart-card">
          <h2>Payment unavailable</h2>
          <p>
            {error instanceof Error
              ? error.message
              : "Unable to load this order."}
          </p>
        </div>
      </div>
    );
  }
}
