import Link from "next/link";
import styles from "./staff-console.module.css";
export function StaffNav({ active }: { active: "overview" | "orders" | "catalog" | "categories" | "promotions" | "returns" }) {
  return <nav className={styles.nav} aria-label="Staff console">
    <Link className={active === "overview" ? styles.navActive : ""} href="/staff">Overview</Link>
    <Link className={active === "orders" ? styles.navActive : ""} href="/staff/orders">Orders</Link>
    <Link className={active === "catalog" ? styles.navActive : ""} href="/staff/catalog">Catalog</Link>
    <Link className={active === "categories" ? styles.navActive : ""} href="/staff/categories">Categories</Link>
    <Link className={active === "promotions" ? styles.navActive : ""} href="/staff/promotions">Promotions</Link>
    <Link className={active === "returns" ? styles.navActive : ""} href="/staff/returns">Returns</Link>
  </nav>;
}
