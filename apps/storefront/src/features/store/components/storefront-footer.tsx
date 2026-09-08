import Link from "next/link";
import { getStoreInfo } from "../data/store-info-api";
import type { StoreInfo } from "../domain/store-info";
import { siteConfig } from "@/shared/config/site";

const fallbackStoreInfo: Pick<
  StoreInfo,
  "storeName" | "storeTagline" | "storeDescription" | "countryCode" | "currency"
> = {
  storeName: siteConfig.name,
  storeTagline: "",
  storeDescription: siteConfig.description,
  countryCode: "MY",
  currency: "MYR",
};

function getCountryName(countryCode: string) {
  const normalized = countryCode.trim().toUpperCase();
  if (!normalized) return "";

  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}

function getBrandMark(storeName: string) {
  return storeName.trim().charAt(0).toUpperCase() || "T";
}

export async function StorefrontFooter() {
  const info = await getStoreInfo().catch(() => fallbackStoreInfo);
  const storeName = info.storeName.trim() || fallbackStoreInfo.storeName;
  const description =
    info.storeTagline.trim() ||
    info.storeDescription.trim() ||
    fallbackStoreInfo.storeDescription;
  const country = getCountryName(info.countryCode);
  const currency = info.currency.trim().toUpperCase() || fallbackStoreInfo.currency;

  return (
    <footer className="site-footer">
      <div className="shell footer-top">
        <div>
          <Link className="brand brand--footer" href="/" aria-label={`${storeName} home`}>
            <span className="brand-mark">{getBrandMark(storeName)}</span>
            <span>{storeName}</span>
          </Link>
          <p>{description}</p>
        </div>

        <div>
          <h3>Shop</h3>
          <Link href="/?sort=newest#shop">New arrivals</Link>
          <Link href="/#shop">Shop all</Link>
          <Link href="/?inStock=true#shop">In stock</Link>
          <Link href="/#shop">Browse categories</Link>
        </div>

        <div>
          <h3>Help</h3>
          <Link href="/store/delivery">Delivery</Link>
          <Link href="/store/returns">Returns</Link>
          <Link href="/store/contact">Contact us</Link>
          <Link href="/store/faq">FAQ</Link>
        </div>

        <div>
          <h3>About</h3>
          <Link href="/store/about">Our store</Link>
          <Link href="/store/trust">Trust &amp; safety</Link>
          <Link href="/store/terms">Terms</Link>
          <Link href="/store/privacy">Privacy</Link>
        </div>
      </div>

      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} {storeName}</span>
        <span>{[country, currency].filter(Boolean).join(" · ")}</span>
      </div>
    </footer>
  );
}
