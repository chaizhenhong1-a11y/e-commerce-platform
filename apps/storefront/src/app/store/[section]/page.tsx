import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreInfo } from "@/features/store/data/store-info-api";
import type { StoreInfoSection } from "@/features/store/domain/store-info";
import styles from "./store-info.module.css";

export const dynamic = "force-dynamic";

const sections: Record<StoreInfoSection, { title: string; eyebrow: string }> = {
  about: { title: "Our store", eyebrow: "ABOUT" },
  delivery: { title: "Delivery", eyebrow: "HELP" },
  returns: { title: "Returns", eyebrow: "HELP" },
  contact: { title: "Contact us", eyebrow: "HELP" },
  faq: { title: "FAQ", eyebrow: "HELP" },
  trust: { title: "Trust & safety", eyebrow: "ABOUT" },
  terms: { title: "Terms", eyebrow: "LEGAL" },
  privacy: { title: "Privacy", eyebrow: "LEGAL" },
};

function isSection(value: string): value is StoreInfoSection {
  return value in sections;
}

function address(info: Awaited<ReturnType<typeof getStoreInfo>>) {
  return [info.addressLine1, info.addressLine2, info.postcode, info.city, info.state, info.countryCode]
    .filter(Boolean)
    .join(", ");
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(cents / 100);
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  return isSection(section) ? { title: sections[section].title } : {};
}

export default async function StoreInformationPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isSection(section)) notFound();

  const info = await getStoreInfo();
  const current = sections[section];
  const content = section === "about"
    ? info.storeDescription
    : section === "delivery"
      ? info.deliveryPolicy
      : section === "returns"
        ? info.returnsPolicy
        : section === "faq"
          ? info.faqContent
          : section === "trust"
            ? info.trustSafetyContent
            : section === "terms"
              ? info.termsContent
              : section === "privacy"
                ? info.privacyContent
                : "";

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>{current.eyebrow}</span>
        <h1>{current.title}</h1>
        <p>{info.storeTagline || `${info.storeName} customer information and support.`}</p>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          {section === "contact" ? (
            <>
              <h2>Talk to {info.storeName}</h2>
              <div className={styles.meta}>
                <div className={styles.metaItem}><span>Email</span><a href={`mailto:${info.contactEmail}`}>{info.contactEmail}</a></div>
                {info.contactPhone ? <div className={styles.metaItem}><span>Phone</span><a href={`tel:${info.contactPhone}`}>{info.contactPhone}</a></div> : null}
                {info.businessHours ? <div className={styles.metaItem}><span>Hours</span><strong>{info.businessHours}</strong></div> : null}
              </div>
            </>
          ) : section === "delivery" ? (
            <>
              <h2>Delivery</h2>
              <div className={styles.meta}>
                <div className={styles.metaItem}>
                  <span>Standard delivery</span>
                  <strong>{money(info.standardShippingCents, info.currency)}</strong>
                </div>
                {info.freeShippingThresholdCents > 0 ? (
                  <div className={styles.metaItem}>
                    <span>Free delivery</span>
                    <strong>Orders over {money(info.freeShippingThresholdCents, info.currency)}</strong>
                  </div>
                ) : null}
              </div>
              <div style={{ marginTop: 32 }}>
                <h3 style={{ margin: "0 0 12px" }}>Delivery information</h3>
                <div className={styles.content}>
                  {content || "This information is being prepared by the store team."}
                </div>
              </div>
            </>
          ) : section === "about" ? (
            <>
              <h2>About {info.storeName}</h2>
              <div className={styles.content}>{content || "This information is being prepared by the store team."}</div>
              <div className={styles.locations}>
                {info.locations.map((location) => {
                  const branchAddress = [location.addressLine1, location.addressLine2, location.postcode, location.city, location.state, location.countryCode].filter(Boolean).join(", ");
                  return (
                    <Link className={styles.locationRow} href={`/store/about/${location.id}`} key={location.id}>
                      <div className={styles.locationThumb}>
                        {location.coverUrl ? <img src={location.coverUrl} alt={`${location.name} storefront`} /> : <span>STORE</span>}
                      </div>
                      <div className={styles.locationSummary}>
                        <div className={styles.branchHeading}>
                          <h3>{location.name}</h3>
                          {location.isPrimary ? <span>Primary store</span> : null}
                        </div>
                        {branchAddress ? <p><b>Address</b>{branchAddress}</p> : null}
                        {location.businessHours ? <p><b>Hours</b>{location.businessHours}</p> : null}
                        {location.phone ? <p><b>Contact</b>{location.phone}</p> : null}
                      </div>
                      <span className={styles.locationArrow} aria-hidden="true">›</span>
                    </Link>
                  );
                })}
                {!info.locations.length && address(info) ? <div className={styles.storeLocation}><span>STORE LOCATION</span><strong>{address(info)}</strong>{info.businessHours ? <small>{info.businessHours}</small> : null}</div> : null}
              </div>
            </>
          ) : (
            <>
              <h2>{current.title}</h2>
              <div className={styles.content}>{content || "This information is being prepared by the store team."}</div>
            </>
          )}
        </section>

        <aside className={styles.card}>
          <h3>Store details</h3>
          <div className={styles.storeIdentity}>
            {info.logoUrl ? (
              <img className={styles.storeLogo} src={info.logoUrl} alt={`${info.storeName} logo`} />
            ) : null}
            <div className={styles.metaItem}>
              <span>Store</span>
              <strong>{info.storeName}</strong>
            </div>
          </div>
          <div className={styles.meta}>
            
          </div>
          <div className={styles.socials}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              {info.instagramUrl ? <a href={info.instagramUrl} target="_blank" rel="noreferrer">Instagram</a> : null}
              {info.facebookUrl ? <a href={info.facebookUrl} target="_blank" rel="noreferrer">Facebook</a> : null}
              {info.tiktokUrl ? <a href={info.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a> : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
