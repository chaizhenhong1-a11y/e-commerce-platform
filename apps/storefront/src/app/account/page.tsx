import type { Metadata } from "next";
import { AccountDashboard } from "@/features/account/components/account-dashboard";

export const metadata: Metadata = {
  title: "My account",
};

export default function AccountPage() {
  return <AccountDashboard />;
}
