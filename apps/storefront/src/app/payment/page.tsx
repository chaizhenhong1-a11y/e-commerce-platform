import { PaymentView } from "@/features/payment/components/payment-view";

export const metadata = { title: "Payment" };

type PaymentPageProps = { searchParams: Promise<{ order?: string }> };

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const { order } = await searchParams;
  if (!order) {
    return <div className="shell checkout-page"><div className="empty-cart-card"><h2>Missing order</h2><p>A valid order number is required to continue payment.</p></div></div>;
  }
  return <div className="shell checkout-page"><PaymentView orderNumber={order} /></div>;
}
