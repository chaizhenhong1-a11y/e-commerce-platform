import type { Metadata } from "next";
import { VerifyEmailView } from "@/features/account/components/verify-email-view";
export const metadata: Metadata = { title: "Verify email" };
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] ?? "" : params.token ?? "";
  return <div className="account-auth-page shell"><VerifyEmailView token={token} /></div>;
}
