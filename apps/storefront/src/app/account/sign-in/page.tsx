import type { Metadata } from "next";
import { SignInForm } from "@/features/account/components/sign-in-form";
import { AccountAuthBrandPanel } from "@/features/account/components/account-auth-brand-panel";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="account-auth-page shell">
      <AccountAuthBrandPanel />
      <SignInForm returnTo={params.returnTo} />
    </div>
  );
}
