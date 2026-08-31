import type { Metadata } from "next";
import { RegisterForm } from "@/features/account/components/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="account-auth-page shell">
      <RegisterForm />
    </div>
  );
}
