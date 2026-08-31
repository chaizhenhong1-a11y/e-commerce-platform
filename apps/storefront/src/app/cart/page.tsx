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

      <div className="cart-page-heading">
        <div>
          <span className="section-kicker">YOUR BAG</span>
          <h1>Shopping cart</h1>
        </div>
        <Link href="/#shop">Continue shopping →</Link>
      </div>

      <CartView />
    </div>
  );
}
