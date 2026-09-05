import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/account/components/forgot-password-form";
import { AccountAuthBrandPanel } from "@/features/account/components/account-auth-brand-panel";
export const metadata: Metadata = { title: "Forgot password" };
export default function ForgotPasswordPage() { return <div className="account-auth-page shell"><AccountAuthBrandPanel /><ForgotPasswordForm /></div>; }
