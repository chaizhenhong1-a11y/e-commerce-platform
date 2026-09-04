import Link from "next/link";
import { CartView } from "@/features/cart/components/cart-view";

export const metadata = { title: "Shopping Cart" };

export default function CartPage() {
  return (
    <div className="shell cart-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Cart</span>
      </nav>

      <header className="cart-page-heading">
        <div>
          <span className="section-kicker">YOUR BAG</span>
          <h1>Shopping cart</h1>
          <p>Review your items before continuing to checkout.</p>
        </div>
        <Link className="cart-page-heading__link" href="/#shop">Continue shopping <span>→</span></Link>
      </header>

      <CartView />
    </div>
  );
}
