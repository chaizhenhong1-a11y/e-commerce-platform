import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/account/components/reset-password-form";
import { AccountAuthBrandPanel } from "@/features/account/components/account-auth-brand-panel";
export const metadata: Metadata = { title: "Reset password" };
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] ?? "" : params.token ?? "";
  return <div className="account-auth-page shell"><AccountAuthBrandPanel /><ResetPasswordForm token={token} /></div>;
}
