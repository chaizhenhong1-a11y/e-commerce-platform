import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteConfig } from "@/shared/config/site";
import { WishlistHeaderLink } from "@/features/wishlist/components/wishlist-header-link";
import { WishlistProvider } from "@/features/wishlist/components/wishlist-provider";
import { OrdersHeaderLink } from "@/features/orders/components/orders-header-link";
import { HeaderActionIcon } from "@/shared/components/header-action-icon";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

const categories = [
  "New arrivals",
  "Women",
  "Men",
  "Home",
  "Lifestyle",
  "Accessories",
  "Sale",
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
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
                <Link href="/#shop" key={category}>
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="shell footer-top">
            <div>
              <Link className="brand brand--footer" href="/">
                <span className="brand-mark">T</span>
                <span>{siteConfig.name}</span>
              </Link>
              <p>
                Curated everyday products with clear pricing, reliable delivery,
                and straightforward service.
              </p>
            </div>

            <div>
              <h3>Shop</h3>
              <Link href="/#shop">New arrivals</Link>
              <Link href="/#shop">Best sellers</Link>
              <Link href="/#shop">Home & living</Link>
              <Link href="/#shop">Accessories</Link>
            </div>

            <div>
              <h3>Help</h3>
              <Link href="/#about">Delivery</Link>
              <Link href="/#about">Returns</Link>
              <Link href="/#about">Contact us</Link>
              <Link href="/#about">FAQ</Link>
            </div>

            <div>
              <h3>About</h3>
              <Link href="/#about">Our story</Link>
              <Link href="/#about">Trust & safety</Link>
              <Link href="/#about">Terms</Link>
              <Link href="/#about">Privacy</Link>
            </div>
          </div>

          <div className="shell footer-bottom">
            <span>© {new Date().getFullYear()} {siteConfig.name}</span>
            <span>Malaysia · MYR</span>
          </div>
        </footer>
        </WishlistProvider>
      </body>
    </html>
  );
}
