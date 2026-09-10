import Link from "next/link";
import styles from "./staff-console.module.css";

type StaffSection =
  | "overview"
  | "orders"
  | "catalog"
  | "inventory"
  | "categories"
  | "promotions"
  | "returns"
  | "refunds"
  | "settings";

const groups: Array<{
  label: string;
  items: Array<{ key: StaffSection; label: string; href: string; short: string }>;
}> = [
  {
    label: "Workspace",
    items: [{ key: "overview", label: "Overview", href: "/staff", short: "OV" }],
  },
  {
    label: "Commerce",
    items: [
      { key: "orders", label: "Orders", href: "/staff/orders", short: "OR" },
      { key: "returns", label: "Returns", href: "/staff/returns", short: "RT" },
      { key: "refunds", label: "Refunds", href: "/staff/refunds", short: "RF" },
    ],
  },
  {
    label: "Products",
    items: [
      { key: "catalog", label: "Catalog", href: "/staff/catalog", short: "CA" },
      { key: "inventory", label: "Inventory", href: "/staff/inventory", short: "IN" },
      { key: "categories", label: "Categories", href: "/staff/categories", short: "CT" },
      { key: "promotions", label: "Promotions", href: "/staff/promotions", short: "PR" },
    ],
  },
  {
    label: "Store",
    items: [{ key: "settings", label: "Store settings", href: "/staff/settings", short: "ST" }],
  },
];

export function StaffNav({ active }: { active: StaffSection }) {
  return (
    <>
      <span className="staff-route-marker" aria-hidden="true" />
      <aside className={styles.staffSidebar}>
        <div className={styles.staffBrand}>
          <Link href="/staff" className={styles.staffBrandLink}>
            <span className={styles.staffBrandMark}>T</span>
            <span>
              <strong>Elvane</strong>
              <small>Staff Console</small>
            </span>
          </Link>
        </div>

        <nav className={styles.staffNav} aria-label="Staff console">
          {groups.map((group) => (
            <div className={styles.staffNavGroup} key={group.label}>
              <span className={styles.staffNavLabel}>{group.label}</span>
              {group.items.map((item) => (
                <Link
                  key={item.key}
                  className={active === item.key ? styles.staffNavActive : ""}
                  href={item.href}
                  aria-current={active === item.key ? "page" : undefined}
                >
                  <span className={styles.staffNavIcon} aria-hidden="true">{item.short}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.staffSidebarFooter}>
          <Link href="/">View store <span aria-hidden="true">↗</span></Link>
          <span>Merchant workspace</span>
        </div>
      </aside>

      <div className={styles.staffMobileBar}>
        <Link href="/staff" className={styles.staffMobileBrand}>
          <span className={styles.staffBrandMark}>T</span>
          <strong>Staff Console</strong>
        </Link>
        <nav aria-label="Staff console mobile">
          {groups.flatMap((group) => group.items).map((item) => (
            <Link
              key={item.key}
              className={active === item.key ? styles.staffMobileActive : ""}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
