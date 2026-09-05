export function AccountAuthBrandPanel() {
  return (
    <aside className="account-auth-brand-panel" aria-hidden="true">
      <span className="account-auth-brand-panel__pill">TEXTSHOP</span>

      <div className="account-auth-brand-panel__copy">
        <h2>
          Your account.
          <br />
          Your shop.
          <br />
          Everywhere.
        </h2>
        <p>
          One account keeps your cart, wishlist, orders and delivery details
          together.
        </p>
      </div>

      <div className="account-auth-brand-panel__orbit" />
      <div className="account-auth-brand-panel__disc" />

      <div className="account-auth-brand-panel__secure">
        <span className="account-auth-brand-panel__lock" />
        <span>SECURE CUSTOMER ACCESS</span>
      </div>
    </aside>
  );
}
