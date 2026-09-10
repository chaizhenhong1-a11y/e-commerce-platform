import type { StoreInfo } from "../domain/store-info";

const apiBaseUrl =
  process.env.ELVANE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

export async function getStoreInfo(): Promise<StoreInfo> {
  const response = await fetch(`${apiBaseUrl}/store-info`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load store information (${response.status}).`);
  }
  return response.json() as Promise<StoreInfo>;
}
