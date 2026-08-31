import Link from "next/link";
import { CheckoutView } from "@/features/checkout/components/checkout-view";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="shell checkout-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/cart">Cart</Link>
        <span>/</span>
        <span>Checkout</span>
      </nav>

      <div className="checkout-page-heading">
        <div>
          <span className="section-kicker">SECURE CHECKOUT</span>
          <h1>Delivery details</h1>
        </div>
        <span className="checkout-page-lock">🔒 Protected checkout</span>
      </div>

      <CheckoutView />
    </div>
  );
}
