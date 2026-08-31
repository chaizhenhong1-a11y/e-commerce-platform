import type { Metadata } from "next";
import { SignInForm } from "@/features/account/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="account-auth-page shell">
      <SignInForm />
    </div>
  );
}
