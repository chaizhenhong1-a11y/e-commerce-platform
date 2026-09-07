import { StaffOrderDetail } from "@/features/staff/components/staff-order-detail";

type StaffOrderDetailPageProps = {
  params: Promise<{ orderNumber: string }>;
};

export const dynamic = "force-dynamic";

export default async function StaffOrderDetailPage({
  params,
}: StaffOrderDetailPageProps) {
  const { orderNumber } = await params;

  return <StaffOrderDetail orderNumber={orderNumber} />;
}
