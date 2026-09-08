import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteConfig } from "@/shared/config/site";
import { WishlistHeaderLink } from "@/features/wishlist/components/wishlist-header-link";
import { WishlistProvider } from "@/features/wishlist/components/wishlist-provider";
import { OrdersHeaderLink } from "@/features/orders/components/orders-header-link";
import { HeaderActionIcon } from "@/shared/components/header-action-icon";
import { NotificationHeaderLink } from "@/features/notifications/components/notification-header-link";
import { StorefrontFooter } from "@/features/store/components/storefront-footer";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

const categories = [
  { label: "New arrivals", href: "/#shop" },
  { label: "Women", href: "/?category=Women#shop" },
  { label: "Men", href: "/?category=Men#shop" },
  { label: "Home", href: "/?category=Home#shop" },
  { label: "Lifestyle", href: "/?category=Lifestyle#shop" },
  { label: "Accessories", href: "/?category=Accessories#shop" },
  { label: "Sale", href: "/?category=Sale#shop" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WishlistProvider>
        <div className="announcement-bar">
          <div className="shell announcement-bar__inner">
            <span>Free delivery over RM150</span>
            <span>Easy 14-day returns</span>
            <span>Secure checkout</span>
          </div>
        </div>

        <header className="site-header">
          <div className="shell header-main">
            <Link className="brand" href="/" aria-label={`${siteConfig.name} home`}>
              <span className="brand-mark">T</span>
              <span>{siteConfig.name}</span>
            </Link>

            <form className="header-search" action="/#shop" method="get" role="search">
              <span className="header-search__icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                name="q"
                placeholder="Search products, categories and brands"
                aria-label="Search products"
              />
              <button type="submit">Search</button>
            </form>

            <nav className="header-actions" aria-label="Account navigation">
              <NotificationHeaderLink />
              <WishlistHeaderLink />
              <Link href="/account" className="header-action">
                <span className="header-action__icon" aria-hidden="true"><HeaderActionIcon name="account" /></span>
                <span className="header-action__text">
                  <small>Hello</small>
                  <strong>Account</strong>
                </span>
              </Link>
              <OrdersHeaderLink />
              <Link href="/cart" className="header-action header-action--cart">
                <span className="header-action__icon" aria-hidden="true"><HeaderActionIcon name="cart" /></span>
                <span className="header-action__text">
                  <small>Your</small>
                  <strong>Cart</strong>
                </span>
              </Link>
            </nav>
          </div>

          <div className="category-nav">
            <div className="shell category-nav__inner">
              {categories.map((category) => (
                <Link href={category.href} key={category.label}>
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="storefront-main">{children}</main>

        <StorefrontFooter />
        </WishlistProvider>
      </body>
    </html>
  );
}
