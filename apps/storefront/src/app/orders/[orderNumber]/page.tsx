import { notFound } from "next/navigation";
import { OrderStatusView } from "@/features/orders/components/order-status-view";
import { getOrderStatus } from "@/features/orders/data/order-api";

type OrderStatusPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export const dynamic = "force-dynamic";

export default async function OrderStatusPage({
  params,
}: OrderStatusPageProps) {
  const { orderNumber } = await params;

  try {
    const order = await getOrderStatus(orderNumber);

    return (
      <div className="shell checkout-page">
        <OrderStatusView order={order} />
      </div>
    );
  } catch {
    notFound();
  }
}
