import type { Metadata } from "next";
import { OrdersCenter } from "@/features/orders/components/orders-center";

export const metadata: Metadata = {
  title: "My orders",
};

export default function AccountOrdersPage() {
  return <OrdersCenter />;
}
