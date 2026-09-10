"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginCustomer } from "../data/account-api";
import { markAccountSignedIn } from "../lib/account-route-cache";

export function SignInForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await loginCustomer({
        email: email.trim(),
        password,
      });
      markAccountSignedIn();
      const target = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : "/account";
      router.replace(target);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to sign in.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="account-form-card" onSubmit={submit}>
      <span className="section-kicker">WELCOME BACK</span>
      <h1>Sign in to Elvane</h1>
      <p>View your orders and continue checkout with your account.</p>

      <label className="checkout-field">
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="checkout-field">
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <div className="account-form-card__assist">
        <Link href="/account/forgot-password">Forgot password?</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <button
        className="button button--checkout"
        type="submit"
        disabled={busy}
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>

      <p className="account-form-card__switch">
        New here? <Link href="/account/register">Create account</Link>
      </p>
    </form>
  );
}
