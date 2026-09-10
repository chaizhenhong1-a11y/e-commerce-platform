"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "../data/account-api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to request password reset.");
    } finally { setBusy(false); }
  }

  if (sent) {
    return <div className="account-form-card account-result-card">
      <span className="section-kicker">CHECK YOUR EMAIL</span>
      <h1>Reset link requested</h1>
      <p>If an active Elvane account exists for that email, a password reset link has been sent.</p>
      <Link className="button button--primary" href="/account/sign-in">Back to sign in</Link>
    </div>;
  }

  return <form className="account-form-card" onSubmit={submit}>
    <span className="section-kicker">ACCOUNT RECOVERY</span>
    <h1>Forgot your password?</h1>
    <p>Enter your account email and we’ll send a secure reset link.</p>
    <label className="checkout-field">
      <span>Email</span>
      <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
    </label>
    {error ? <p className="form-error">{error}</p> : null}
    <button className="button button--checkout" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
    <p className="account-form-card__switch"><Link href="/account/sign-in">Back to sign in</Link></p>
  </form>;
}
