import { notFound } from "next/navigation";
import { OrderStatusView } from "@/features/orders/components/order-status-view";
import { getOrderStatus } from "@/features/orders/data/order-api";
import { PaymentReturnReconciler } from "@/features/payment/components/payment-return-reconciler";

type OrderStatusPageProps = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ payment?: string }>;
};

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({
  params,
  searchParams,
}: OrderStatusPageProps) {
  const { orderNumber } = await params;
  const { payment } = await searchParams;

  try {
    const order = await getOrderStatus(orderNumber);

    return (
      <div className="shell checkout-page">
        <PaymentReturnReconciler orderNumber={orderNumber} paymentReturn={payment} />
        <OrderStatusView order={order} suppressPaymentActions={payment === "success"} />
      </div>
    );
  } catch {
    notFound();
  }
}
