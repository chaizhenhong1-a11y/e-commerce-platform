"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { registerCustomer } from "../data/account-api";
import { markAccountSignedIn } from "../lib/account-route-cache";

export function RegisterForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await registerCustomer({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
      });
      markAccountSignedIn();
      router.replace("/account");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to create account.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="account-form-card" onSubmit={submit}>
      <span className="section-kicker">JOIN TEXTSHOP</span>
      <h1>Create your account</h1>
      <p>Keep your future orders together in one secure account.</p>

      <div className="checkout-field-grid">
        <label className="checkout-field">
          <span>First name</span>
          <input
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                firstName: event.target.value,
              }))
            }
          />
        </label>

        <label className="checkout-field">
          <span>Last name</span>
          <input
            autoComplete="family-name"
            value={form.lastName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                lastName: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <label className="checkout-field">
        <span>Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
        />
      </label>

      <label className="checkout-field">
        <span>Password</span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
        />
        <small>At least 8 characters with upper/lowercase and a number.</small>
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button
        className="button button--checkout"
        type="submit"
        disabled={busy}
      >
        {busy ? "Creating…" : "Create account"}
      </button>

      <p className="account-form-card__switch">
        Already registered? <Link href="/account/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
