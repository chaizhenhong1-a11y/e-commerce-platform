import type {
  Customer,
  CustomerOrder,
  CustomerAddress,
  CustomerAddressInput,
} from "../domain/account";

async function readJson<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | T
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const raw =
      body && typeof body === "object" && "message" in body
        ? body.message
        : undefined;
    const message = Array.isArray(raw)
      ? raw.join(" ")
      : raw;

    throw new Error(message || fallbackMessage);
  }

  return body as T;
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJson<Customer>(
    response,
    "Unable to create account.",
  );
}

export async function loginCustomer(input: {
  email: string;
  password: string;
}) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readJson<Customer>(
    response,
    "Unable to sign in.",
  );
}

export async function logoutCustomer() {
  await fetch("/api/auth/logout", {
    method: "POST",
  });

  if (typeof window !== "undefined") {
    window.localStorage.removeItem("textshop.cart.session");
    window.dispatchEvent(new CustomEvent("textshop:auth-signed-out"));
  }
}

export async function getCurrentCustomer() {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  return readJson<Customer>(
    response,
    "Unable to load account.",
  );
}

export async function getCustomerOrders() {
  const response = await fetch("/api/account/orders", {
    cache: "no-store",
  });

  return readJson<CustomerOrder[]>(
    response,
    "Unable to load orders.",
  );
}

export async function requestPasswordReset(email: string) {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return readJson<{ accepted: boolean }>(response, "Unable to request password reset.");
}

export async function resetCustomerPassword(input: {
  token: string;
  password: string;
}) {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<{ success: boolean }>(response, "Unable to reset password.");
}

export async function verifyCustomerEmail(token: string) {
  const response = await fetch("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return readJson<{ success: boolean }>(response, "Unable to verify email.");
}

export async function resendVerificationEmail() {
  const response = await fetch("/api/auth/resend-verification", {
    method: "POST",
  });
  return readJson<{ accepted: boolean; alreadyVerified?: boolean }>(
    response,
    "Unable to resend verification email.",
  );
}


export async function updateCustomerProfile(input: {
  firstName: string;
  lastName?: string;
}) {
  const response = await fetch("/api/account/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<Customer>(response, "Unable to update profile.");
}

export async function getCustomerAddresses() {
  const response = await fetch("/api/account/addresses", {
    cache: "no-store",
  });
  return readJson<CustomerAddress[]>(response, "Unable to load addresses.");
}

export async function createCustomerAddress(input: CustomerAddressInput) {
  const response = await fetch("/api/account/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<CustomerAddress>(response, "Unable to save address.");
}

export async function updateCustomerAddress(
  id: string,
  input: CustomerAddressInput,
) {
  const response = await fetch(`/api/account/addresses/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<CustomerAddress>(response, "Unable to update address.");
}

export async function setDefaultCustomerAddress(id: string) {
  const response = await fetch(
    `/api/account/addresses/${encodeURIComponent(id)}/default`,
    { method: "POST" },
  );
  return readJson<CustomerAddress>(response, "Unable to set default address.");
}

export async function deleteCustomerAddress(id: string) {
  const response = await fetch(`/api/account/addresses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return readJson<{ success: boolean }>(response, "Unable to delete address.");
}
