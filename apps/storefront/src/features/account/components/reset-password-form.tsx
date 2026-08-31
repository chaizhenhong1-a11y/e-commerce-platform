"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { resetCustomerPassword } from "../data/account-api";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      await resetCustomerPassword({ token, password });
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reset password.");
    } finally { setBusy(false); }
  }

  if (!token) return <div className="account-form-card account-result-card"><h1>Invalid reset link</h1><p>This password reset link is missing its security token.</p><Link className="button button--primary" href="/account/forgot-password">Request another link</Link></div>;
  if (complete) return <div className="account-form-card account-result-card"><span className="section-kicker">PASSWORD UPDATED</span><h1>Your password has been reset</h1><p>All previous sign-in sessions were revoked. Sign in again with your new password.</p><Link className="button button--primary" href="/account/sign-in">Sign in</Link></div>;

  return <form className="account-form-card" onSubmit={submit}>
    <span className="section-kicker">SECURE RESET</span><h1>Create a new password</h1><p>Use a password you do not reuse on other services.</p>
    <label className="checkout-field"><span>New password</span><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /><small>At least 8 characters with upper/lowercase and a number.</small></label>
    <label className="checkout-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></label>
    {error ? <p className="form-error">{error}</p> : null}
    <button className="button button--checkout" type="submit" disabled={busy}>{busy ? "Updating…" : "Reset password"}</button>
  </form>;
}
