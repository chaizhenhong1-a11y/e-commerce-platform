import type { Metadata } from "next";
import { RegisterForm } from "@/features/account/components/register-form";
import { AccountAuthBrandPanel } from "@/features/account/components/account-auth-brand-panel";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="account-auth-page shell">
      <AccountAuthBrandPanel />
      <RegisterForm />
    </div>
  );
}
