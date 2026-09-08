import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreInfo } from "@/features/store/data/store-info-api";
import { BranchPhotoCarousel } from "./branch-photo-carousel";
import styles from "./branch-detail.module.css";

export const dynamic = "force-dynamic";

function address(location: {
  addressLine1: string;
  addressLine2: string;
  postcode: string;
  city: string;
  state: string;
  countryCode: string;
}) {
  return [location.addressLine1, location.addressLine2, location.postcode, location.city, location.state, location.countryCode]
    .filter(Boolean)
    .join(", ");
}

export async function generateMetadata({ params }: { params: Promise<{ locationId: string }> }): Promise<Metadata> {
  const { locationId } = await params;
  const info = await getStoreInfo();
  const location = info.locations.find((item) => item.id === locationId);
  return { title: location ? `${location.name} | Our store` : "Our store" };
}

export default async function StoreLocationDetailPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = await params;
  const info = await getStoreInfo();
  const location = info.locations.find((item) => item.id === locationId);
  if (!location) notFound();

  const branchAddress = address(location);
  const photos = [location.coverUrl, ...location.galleryUrls].filter((url, index, all) => Boolean(url) && all.indexOf(url) === index);
  const directionsUrl = branchAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branchAddress)}`
    : "";

  return (
    <main className={styles.page}>
      <Link href="/store/about" className={styles.back}>← All stores</Link>

      <section className={styles.header}>
        <div className={styles.storeIcon} aria-hidden="true">STORE</div>
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}>STORE LOCATION</span>
          <div className={styles.titleRow}>
            <h1>{location.name}</h1>
            {location.isPrimary ? <span className={styles.primary}>PRIMARY STORE</span> : null}
          </div>
          {branchAddress ? <p className={styles.headerAddress}>{branchAddress}</p> : null}
          <p>{location.description || `Visit ${location.name} for the in-store ${info.storeName} experience.`}</p>
        </div>
      </section>

      <section className={styles.layout}>
        <div className={styles.main}>
          {photos.length ? (
            <BranchPhotoCarousel photos={photos} locationName={location.name} />
          ) : (
            <div className={styles.noPhoto}>STORE</div>
          )}
        </div>

        <aside className={styles.details}>
          <span className={styles.sectionLabel}>VISIT THIS STORE</span>
          <h2>Store details</h2>

          <div className={styles.infoCards}>
            {branchAddress ? (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon} aria-hidden="true">01</span>
                <div>
                  <span>Address</span>
                  <strong>{branchAddress}</strong>
                </div>
              </div>
            ) : null}

            {location.businessHours ? (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon} aria-hidden="true">02</span>
                <div>
                  <span>Business hours</span>
                  <strong>{location.businessHours}</strong>
                </div>
              </div>
            ) : null}

            {location.phone ? (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon} aria-hidden="true">03</span>
                <div>
                  <span>Contact</span>
                  <a href={`tel:${location.phone}`}>{location.phone}</a>
                </div>
              </div>
            ) : null}
          </div>

          {location.phone || directionsUrl ? (
            <div className={styles.actions}>
              {location.phone ? (
                <a className={styles.secondaryAction} href={`tel:${location.phone}`}>Call store</a>
              ) : null}
              {directionsUrl ? (
                <a
                  className={styles.primaryAction}
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get directions
                </a>
              ) : null}
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
