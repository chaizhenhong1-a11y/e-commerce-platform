"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { verifyCustomerEmail } from "../data/account-api";

export function VerifyEmailView({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "Verifying your email…" : "This verification link is missing its security token.");

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyCustomerEmail(token).then(() => {
      if (active) { setState("success"); setMessage("Your email has been verified successfully."); }
    }).catch((cause) => {
      if (active) { setState("error"); setMessage(cause instanceof Error ? cause.message : "Unable to verify email."); }
    });
    return () => { active = false; };
  }, [token]);

  return <div className="account-form-card account-result-card">
    <span className="section-kicker">EMAIL VERIFICATION</span>
    <h1>{state === "success" ? "Email verified" : state === "error" ? "Verification unavailable" : "Verifying…"}</h1>
    <p>{message}</p>
    {state === "success" ? <Link className="button button--primary" href="/account">Continue to account</Link> : null}
    {state === "error" ? <Link className="button" href="/account">Go to account</Link> : null}
  </div>;
}
