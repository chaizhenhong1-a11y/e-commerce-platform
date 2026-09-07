## 0.51.69 - Phase 055.8: Storefront Staff overview route

- Added the missing `/staff` Storefront route and connected it to the existing `StaffDashboard`.
- Restored the Staff `Overview` navigation entry so it no longer resolves to a 404 page.
- Reused the existing Staff dashboard metrics, quick actions, navigation, and styling instead of introducing a parallel dashboard implementation.
- No Staff orders, catalog, categories, promotions, returns, payment, Stripe, Flutter, Prisma, or API behavior changed.
