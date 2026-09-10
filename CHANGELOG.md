## 0.52.63 - Fix active Staff Delivery currency inputs

- Fixed the Store Settings component actually imported by `/staff/settings` (`src/features/staff/components/store-settings.tsx`); the earlier currency-input change was in an unused duplicate.
- Delivery now shows `Standard shipping fee (MYR)` and `Free shipping from (MYR)`, with two-decimal RM inputs such as `8.00` and `150.00`.
- Convert API cents to RM on load and convert RM to integer cents only on PATCH submission (`8.00` to `800`, `150.00` to `15000`). Reject blank, negative, or over-precision amounts; preserve zero-threshold behavior and unsaved-change tracking.
- No database schema, Stripe, checkout, payment return, refund, or payment reconciliation changes.

## 0.52.62 - Phase 055.47.3: Merchant-friendly Delivery & Returns settings

- Reworked Staff → Store Settings → Delivery so merchants enter normal currency amounts instead of raw cents.
- `Standard shipping fee` now displays values such as `8.00` while preserving the existing integer-cents API/database contract internally.
- `Free shipping from` now displays values such as `150.00`; the UI converts them to cents only when updating the existing settings state.
- Kept `Return window (days)` clearly visible in the Returns section for the dynamic storefront announcement bar.
- Added clearer merchant-facing delivery guidance without changing the underlying Store Settings schema.
- No Prisma migration, API schema change, Stripe, checkout, payment-return, reconciliation, refund processing, or Flutter payment changes.

## 0.52.61 - Phase 055.47.2: Dynamic Storefront Announcement Bar

- Removed the hardcoded `Free delivery over RM150` and `Easy 14-day returns` messages from the customer Web announcement bar.
- The free-delivery message now reads the live `freeShippingThresholdCents` and `currency` values from the existing public Store Settings source.
- The returns message now reads the live `returnWindowDays` value from the same Store Settings source.
- Added safe fallback announcement copy when Store Settings cannot be loaded or the corresponding threshold/window is not configured.
- `Secure checkout` remains a fixed system message.
- Staff changes to shipping threshold or return window now flow through to the Web announcement bar without another storefront code edit.
- Reused the existing `getStoreInfo()` contract; no API, Prisma, database, Stripe, checkout, payment-return, reconciliation, refund, return-processing, or Flutter payment code changed.

## 0.52.60 - Phase 055.47.1: Customer Hero Palette Hotfix

- Removed the brown/chocolate palette introduced in the 055.47 homepage hero visual.
- Restored the storefront's established black / charcoal / white / neon-lime visual language.
- Kept the existing hero layout and copy while changing only the visual palette and glass-card accents.
- No photos or image assets were added or generated for the project.
- No Staff, API, Prisma, database, Stripe, checkout, payment-return, reconciliation, refund, return, or Flutter payment code changed.

## 0.52.59 - Phase 055.47: Customer Web Storefront Professionalization

- Refined the customer-facing Web storefront using the current local storefront as the authoritative baseline.
- Reworked the homepage hero into a cleaner commerce-first editorial composition and removed decorative fake product-number objects.
- Replaced unsupported promotional promises in homepage cards and trust messaging with durable catalog, store-information, inventory, checkout, and support messaging.
- Improved catalog filter presentation, mobile behavior, product-card hierarchy, image treatment, category labeling, and explicit `View` product actions.
- Product cards no longer invent a `New` badge when the catalog has no real badge value.
- Removed hardcoded product-detail brand, free-shipping threshold, delivery estimate, and 14-day return promises; product pages now route customers to the store's real Delivery and Returns information instead.
- Improved product-page delivery/returns information cards and retained the existing live variants, stock, wishlist, cart, and review flows.
- No API schema, Prisma migration, database, Staff workflow, Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter payment code changed.

## 0.52.58 - Phase 055.46: Web Staff Console Final UI Unification

- Finalized the shared Web Staff Console presentation using the current post-055.45 codebase as the authoritative source, avoiding rollback of Catalog, Inventory, Categories, Promotions, Orders, Returns, Refunds, and Store Settings work.
- Standardized Staff page headers, descriptions, primary/secondary header actions, spacing, focus states, form-control interaction states, empty states, success/error presentation, and mobile behavior.
- Improved desktop and mobile navigation feedback and added `aria-current="page"` to the active Staff destination for clearer accessibility semantics.
- Added consistent keyboard focus treatment across Staff links, buttons, inputs, selects, and text areas, plus reduced-motion support.
- Preserved the dedicated Staff shell and existing route-marker architecture; customer storefront chrome remains isolated from `/staff`.
- This phase is shared Staff UI polish only: no API schema, Prisma migration, database, Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter payment code changed.

## 0.52.57 - Phase 055.45: Professional Web Staff Store Settings Workspace

- Reworked Store Settings into a structured professional workspace while preserving the existing settings API and StoreSettings data model.
- Added a sticky section navigator for Brand & Profile, Contact, Commerce, Delivery, Returns, Customer Pages, and Social Links.
- Added per-section readiness indicators and an overall configuration progress summary so staff can quickly spot incomplete public-store information.
- Added explicit dirty-state tracking with `Unsaved changes` / `Up to date` status and disabled unnecessary saves when nothing changed.
- Replaced the plain footer action row with a persistent save bar that clearly communicates whether changes still need to be saved.
- Preserved real logo upload, multi-location management, shipping amounts, delivery guidance, structured returns settings, customer information pages, and social links.
- Store Settings remains the single source of truth shared by the Staff API/PostgreSQL and customer-facing Web/Flutter where applicable.
- No API schema, Prisma migration, database, Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter payment code changed.

## 0.52.56 - Phase 055.44: Professional Web Staff Promotions Workspace

- Reworked coupon and automatic-discount management into a unified professional Staff Promotions workspace while preserving the existing promotion APIs and checkout rules.
- Added operational summary metrics, lifecycle separation, clearer campaign switching, and a dedicated coupon campaign directory.
- Coupon campaigns now expose discount value, redemption usage, minimum subtotal, catalog scope, schedule, and current lifecycle state at a glance.
- Added coupon search and Active / Inactive / All views so retired campaigns no longer clutter normal promotion operations.
- Automatic discounts now use the same lifecycle structure and expose active, inactive, catalog-wide, and scoped campaign counts.
- Preserved existing server-authoritative discount evaluation, coupon/automatic best-discount selection, usage limits, schedules, product/category scopes, historical order snapshots, and deactivation behavior.
- No API schema, Prisma migration, database, Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter payment code changed.

## 0.52.55 - Phase 055.43: Professional Web Staff Categories Workspace

- Rebuilt Web Staff Categories into a structured category-management workspace using the existing real category API.
- Added live category summary metrics for total, active, inactive, product assignments, and empty categories.
- Added dedicated Active, Inactive, and All lifecycle views so retired categories do not clutter the normal operating view.
- Added name/slug search, explicit storefront sort priority, customer-visibility status, and one-click activate/deactivate controls.
- Improved category creation/editing with automatic slug generation, clearer storefront visibility language, and sort-order guidance.
- Strengthened deletion safety in the UI: categories containing products cannot be deleted and are directed to deactivation instead; only empty categories expose permanent deletion.
- Preserved the existing `/api/staff/categories` create/update/delete contract and existing product/category relationships.
- No API schema, Prisma migration, database, Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter payment code changed.

## 0.52.54 - Phase 055.42.2: Catalog Lifecycle Separation

- Separated Active Catalog, Drafts, Archived, and All Products into explicit lifecycle views in the Web Staff Catalog.
- The Catalog now opens on `Active catalog` by default so archived products are no longer mixed into the merchant's normal product-management view.
- Archived products remain fully accessible under the dedicated `Archived` view, while Draft products stay separate from live products.
- The existing search, low-stock filter, product photos, publish/unpublish, featured state, variant controls, and inventory adjustments are preserved.
- Web Staff UI-only change; no API, Prisma, database, Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter code changed.

## 0.52.53 - Phase 055.42.1: Catalog CSS Restore Hotfix

- Restored the Phase 055.42 Staff Catalog layout styles after the later 055.41.3 Orders hotfix overwrote the shared `staff-console.module.css` with an older copy.
- Restores the Catalog summary cards, filter toolbar, two-column product cards, constrained product media, variant panels, and responsive layout.
- Keeps the Orders photo UI styles from the current shared stylesheet baseline.
- No API, Prisma, database, Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter code changed.

## 0.52.52 - Phase 055.41.3: Staff Orders Product Photo Scope Hotfix

- Fixed the Staff Orders image resolver so its lookup maps are created inside `getStaffOrders`, the same method that consumes them.
- Resolved the TypeScript `Cannot find name 'imageByVariantId'` / `imageBySku` build errors from the previous image patch.
- Product photo lookup now uses valid OrderItem `variantId` first, falls back by SKU, and then selects variant-specific or product-level primary/default ProductImage records.
- Added `imageUrl` and `imageAltText` to the Staff Orders response and renders the existing real catalog image beside each order item.
- No Prisma migration and no Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter payment code changed.

## 0.52.51 - Phase 055.42: Professional Web Staff Catalog Workspace

- Rebuilt the Web Staff Catalog into a product-focused operational workspace with real product photos, product status, featured state, pricing, SKU counts, availability, and reserved stock visible at a glance.
- Added catalog summary metrics for products, active products, SKUs, available units, and low-stock SKUs using the existing staff catalog response.
- Added clearer search/status/low-stock filtering and a compact result header.
- Product cards now use the existing ProductImage primary/default photo, with a `No image` fallback only when the catalog has no image.
- Moved variant and stock detail into expandable per-product sections while preserving the existing SKU enable/disable and audited inventory adjustment workflows.
- Preserved existing product create/edit, publish/unpublish, featured-product, inventory history, and adjustment endpoints.
- Web Staff UI only: no Prisma migration and no Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter payment code changed.

## 0.52.50 - Phase 055.41.2: Staff Order Photo Resolution Hotfix

- Fixed Staff Orders product thumbnails against the confirmed database shape: OrderItem has valid `variantId` and SKU snapshots while most ProductImage rows are product-level with a null `variantId`.
- Staff order image resolution now matches by current variant ID first, falls back by SKU, then selects a variant image or the product primary/default image.
- Existing ProductImage URLs are reused directly; no image re-upload and no Prisma migration are required.
- No Stripe, checkout, payment-return, payment reconciliation, refund-provider, return-processing, or Flutter payment code changed.

## 0.52.48 - Phase 055.41: Professional Web Staff Orders Console

- Reorganized the Web Staff Orders workspace around the actual fulfillment workflow with dedicated views for All Orders, Awaiting Payment, Ready to Fulfill, Processing, Shipped, Delivered, Fulfilled, and Cancelled.
- Added a one-click `Ready to fulfill` operational preset that combines `CONFIRMED` order status with `PAID` payment status without changing any payment logic.
- Separated order status and payment status visually on every order card so fulfillment state can no longer be confused with financial state.
- Improved order search and advanced filters, added clear/reset behavior, visible result counts, and a more useful empty state.
- Preserved the existing process, ship, tracking, deliver, order-detail, return, and refund signals and actions.
- This phase is Web Staff UI-only: no API, Prisma, database, Stripe, checkout, payment-return, reconciliation, refund-provider, return-processing, or Flutter code changed.

## 0.52.47 - Phase 055.40: Operational Staff Overview Dashboard

- Rebuilt the Web Staff Overview into a real operating dashboard backed by the existing PostgreSQL commerce data.
- Added a focused sales snapshot for today and the current month, including net sales, paid-order counts, average order value, and completed refunds.
- Added actionable operations queues for paid orders ready to fulfill, active returns, refund requests awaiting staff review, low-stock variants, and out-of-stock variants.
- Added recent orders with direct order-detail links and a top-selling products panel based on paid-order item quantities and sales value.
- Added store-management shortcuts for Orders, Inventory, Catalog, and Store Settings while keeping Overview as the Staff Console landing page.
- Extended the existing staff order summary response only; no new database table or Prisma migration is required.
- No checkout, Stripe launch/return, payment reconciliation, payment state machine, refund provider execution, return processing, or Flutter code changed.

## 0.52.46 - Phase 055.39.4: Staff Console entry route fix

- Fixed the Web account `Staff operations` entry so opening Staff Console now lands on `/staff` Overview instead of `/staff/returns`.
- Returns remains available only when staff deliberately selects Returns from the Staff navigation.
- Preserved the existing `/staff` StaffDashboard, sidebar navigation, Inventory work, orders, returns, refunds, catalog, and settings behavior.
- No API, Prisma, database, payment, Stripe, reconciliation, refund-processing, return-processing, order-state, or Flutter code changed.

## 0.52.45 - Phase 055.39.3: Separate Active and Archived inventory

- Split the Web Staff Inventory workspace into dedicated `Active Inventory` and `Archived` views instead of mixing archived products into the operating inventory list.
- `Active Inventory` is now the default operational view; archived product SKUs are visible only after switching to `Archived`.
- Inventory summary cards and stock-state filters now calculate against the selected lifecycle view so archived stock cannot distort active operating totals.
- Added lifecycle SKU counts to the two inventory tabs while preserving product thumbnails, SKU search, stock-state filters, adjustment history, and manual stock corrections.
- Draft products remain outside both operational inventory views; their product setup continues to be managed from Catalog.
- No API, Prisma, database migration, payment, Stripe, reconciliation, refund, return, order-state, or Flutter code changed.

## 0.52.44 - Phase 055.39.2: Inventory image data hotfix

- Fixed the Staff catalog list source used by `/staff/inventory` so it now includes each product's existing image records.
- Inventory thumbnails can now resolve variant-specific images first and fall back to the product primary image using the existing Phase 055.39.1 presentation logic.
- Reused existing ProductImage records and media URLs; no image re-upload, new endpoint, Prisma migration, or database schema change is required.
- Kept inventory quantities, adjustment history, stock filters, and manual stock adjustment behavior unchanged.
- No payment, Stripe, reconciliation, refund, return, order-state, or Flutter code changed.

## 0.52.43 - Phase 055.39.1: Inventory product thumbnail hotfix

- Added product thumbnails to every Web Staff Inventory SKU row.
- Inventory now prefers a variant-specific primary image, then any variant-specific image, then the product primary image, with a clean no-image fallback.
- Reused the existing Staff catalog `images` data; no media upload, API, database, or Prisma changes are required.
- Kept all inventory quantities, adjustment history, stock filtering, and manual adjustment behavior unchanged.
- No payment, Stripe, reconciliation, refund, return, order-state, or Flutter code changed.

## 0.52.42 - Phase 055.39: Web Staff Inventory Console

- Added a dedicated `/staff/inventory` workspace and Inventory navigation under Products.
- Added live SKU-level on-hand, reserved, available, low-stock and out-of-stock visibility using the existing catalog inventory data.
- Added product/SKU search, stock-state filters, manual positive/negative stock adjustment with reasons, and per-SKU inventory history.
- Reused the existing Staff inventory adjustment/history APIs and PostgreSQL inventory records; no Prisma migration was required.
- No payment, Stripe, reconciliation, refund, return, order-state, or Flutter code changed.

## 0.52.41 - Phase 055.38: Web Staff operations UI normalization

- Unified Web Staff Orders and Refunds around the same constrained admin workspace used by the repaired Returns console.
- Rebuilt the Refund approvals filter/action presentation into a clear review toolbar and explicit approve/reject action area without changing refund request or provider behavior.
- Tightened Orders search/status/payment filters and responsive layout while preserving all existing order transitions and shipping actions.
- Polished Store Settings panels and form focus states so Settings visually belongs to the same Staff Console system.
- Preserved the current Staff sidebar, Returns layout baseline, and all existing Staff routes.
- No API, Prisma, payment, Stripe, reconciliation, refund state-machine, return state-machine, or Flutter code changed.

## 0.52.40 - Phase 055.37.4: Staff Returns layout and Storefront chrome hotfix

- Fixed `/staff/returns` so it uses the same shared Staff two-column shell as the rest of the Web admin instead of placing the Staff sidebar inside the Returns page's old standalone max-width container.
- Returns content now stays entirely in the Staff content column; long order numbers and metadata can no longer push or overlap the sidebar.
- Restored the customer Storefront visual order so the footer remains after page content instead of streaming above the header/content.
- `/staff/**` continues to hide customer announcement, header, category navigation, and footer while keeping the dedicated Staff sidebar.
- Preserved the Phase 055.37.1 sidebar viewport containment behavior.
- No return-state transitions, refund provider calls, payment flow, Stripe return handling, reconciliation, API payment logic, Prisma schema, or Flutter code changed.

## 0.52.38 - Phase 055.37.2: Async StorefrontFooter boundary hotfix

- Fixed the Next.js runtime error reporting `<StorefrontFooter>` as an async Client Component after the dedicated Staff shell refactor.
- `StorefrontFooter` is now rendered by the server `RootLayout` and passed into the client-side route chrome as an already-rendered React node.
- `AppChrome` no longer imports the async server footer, preserving the `/staff/**` route split without crossing the Server/Client Component boundary.
- Preserved the dedicated Staff shell, sidebar containment fix, Returns workflow behavior, Web/Flutter payments, Stripe return handling, reconciliation, API payment logic, and Flutter code.

## 0.52.37 - Phase 055.37.1: Staff sidebar viewport containment hotfix

- Fixed the desktop Staff sidebar being taller than the usable browser viewport and clipping the bottom `View store` / merchant workspace area.
- Sidebar height now uses `100dvh` with border-box sizing, while only the navigation list scrolls when the browser window is short.
- Kept the Staff brand and footer pinned inside the sidebar instead of allowing them to be pushed outside the visible panel.
- Preserved the dedicated `/staff/**` shell introduced in Phase 055.37 and did not change Returns workflow behavior, Web/Flutter payments, Stripe return handling, reconciliation, API payment logic, or Flutter code.

## 0.52.36 - Phase 055.37: Dedicated Web Staff application shell

- Separated every `/staff` route from the customer Storefront chrome so Staff pages no longer render the announcement bar, product search, account/cart actions, category navigation, or customer footer.
- Added a route-aware Web application chrome that preserves the existing customer Storefront exactly outside `/staff` while giving Staff Console its own independent workspace surface.
- Kept the Phase 055.36.1 contained sticky Staff sidebar and responsive mobile Staff navigation as the dedicated admin navigation system.
- `View store` remains the explicit path back to the customer Storefront.
- Web Staff layout only: no Flutter, API, Prisma, checkout, Stripe, payment-return, payment reconciliation, provider, refund-processing, or order-payment state logic changed.

## 0.52.35 - Phase 055.36.1: Staff sidebar layout containment hotfix

- Changed the Web Staff sidebar from viewport-fixed positioning to a sticky sidebar contained inside the Staff workspace.
- The customer Storefront header and navigation now keep their full width and are no longer covered by the Staff sidebar.
- Staff content now uses a two-column workspace grid with a responsive mobile fallback, preserving all existing Staff routes and actions.
- No Flutter, API, database, checkout, Stripe, payment reconciliation, refund processing, or payment-return behavior changed.

## 0.52.34 - Phase 055.36: Web Staff Console navigation architecture

- Reorganized the Web Staff Console from a flat eight-link navigation bar into a persistent professional sidebar grouped by Workspace, Commerce, Products, and Store.
- Added clear TextShop Staff Console identity, compact section markers, active navigation treatment, and a dedicated `View store` exit action.
- Added a responsive mobile Staff bar so the same information architecture remains usable on narrow screens without consuming permanent sidebar width.
- Preserved every existing Staff route and feature: Overview, Orders, Returns, Refunds, Catalog, Categories, Promotions, and Store Settings.
- This phase is Web Staff UI/navigation only. Flutter, Stripe checkout, payment return, payment reconciliation, payment provider/API behavior, refund processing logic, Prisma, and customer-facing payment flows are untouched.

## 0.52.33 - Phase 055.35.3: Web Stripe return parity hotfix

- Fixed the Web Stripe success redirect 404 by adding a Storefront-owned lightweight `/payment-return.html`; this is a Web asset and does not modify Flutter.
- Web Stripe checkout now opens in a separate tab while the original Storefront immediately moves to Order Details, matching the stable Flutter Web user flow.
- Order Details listens for the lightweight return-page message and reconciles provider state until the backend confirms payment, with a focus fallback for browsers that sever `window.opener`.
- Web checkout and Order Details no longer route normal Stripe payment through the `/payment` recovery screen.
- `apps/mobile`, Flutter routing, Flutter checkout, and the locked Flutter payment-return implementation are untouched.

## 0.52.31 - Phase 055.35.1: Refund approval Prisma field hotfix

- Fixed the staff refund list Prisma projection to use the actual `Order.shippingName` field instead of the nonexistent `Order.customerName`.
- Staff refund DTO output still exposes the stable `customerName` property by mapping it from `shippingName`.
- This resolves the Prisma `OrderSelect` error and the follow-on missing `order` / `payment` relation type errors in `refunds.service.ts`.
- No payment checkout, Stripe return, order routing, Prisma migration, return workflow, or customer payment-flow changes.

## 0.52.30 - Phase 055.35: Staff refund approval workflow

- Customer direct-refund requests now stop at `REQUESTED` and wait for staff review instead of immediately calling the payment provider.
- Added staff-only refund queue API with status filtering plus atomic Approve and Reject actions.
- Approve claims `REQUESTED -> PROCESSING` before calling the original payment provider; successful provider completion continues through the existing idempotent `REFUNDED` path and Stripe webhook synchronization.
- Reject changes only a pending direct refund to `REJECTED`, records the staff reason, and notifies the customer without moving money.
- Return-based refunds remain isolated in the existing return workflow and cannot be approved from the direct-refund queue.
- Added Flutter Staff Center `Refund approvals` with queue filters, refund details, Approve confirmation and Reject note flow.
- Added Web Staff `Refunds` navigation, review console, and authenticated BFF routes for list/approve/reject.
- Existing Checkout, Stripe payment-return page, Order Details payment navigation, payment reconciliation, return handling and Prisma schema are unchanged.

## 0.52.29 - Phase 055.34.5: Flutter checkout routes to Order details

- After a Stripe Checkout session opens, the original Flutter TextShop tab now immediately navigates from Checkout to the newly created Order details page.
- Flutter Web keeps Stripe in a separate tab, so the customer no longer remains stuck on the disabled `Processing...` checkout screen.
- The customer cart is invalidated after the order has been created and the external Stripe tab is open.
- The lightweight `/payment-return.html` flow from Phase 055.34.4 remains unchanged, preventing a second Flutter app from booting in the payment tab.
- Native payment behavior continues to route to Order details after opening the external provider.
- No API, Prisma, Web Storefront, refund, return, or router changes are included.

## 0.52.28 - Phase 055.34.4: Flutter Web lightweight Stripe return

- Stripe success and cancellation redirects for Flutter Web now target the static `/payment-return.html` page instead of booting a second Flutter `/orders/:orderNumber` route.
- Added a lightweight payment-return page that requires no Flutter bootstrap, router, or authentication state and safely closes the Stripe tab after a successful payment.
- The original TextShop tab remains responsible for live refresh/payment reconciliation, so a newly opened payment tab can no longer show `Sign in to view orders`.
- Stripe return URLs continue to validate against the existing allowed return origin rules.
- No Prisma migration, Web Storefront, refund, return, or Flutter router changes are included.

## 0.52.26 - Phase 055.34.3: Flutter Web isolated Stripe checkout

- Flutter Web opens Stripe Checkout in a separate browser tab instead of replacing the running TextShop tab with `_self`.
- The original Order Details widget tree, router, authentication state, and Riverpod state remain mounted while payment is completed.
- Existing live order refresh and dedicated payment reconciliation remain responsible for reflecting confirmed payment state.
- Native Android/iOS payment launching is unchanged.
- No Web Storefront, API, Prisma, refund, return, or router changes are included.

## 0.52.25 - Phase 055.34.2.1: Flutter analyzer hotfix

- Wrapped CheckoutRepository single-line `if` statements in blocks to satisfy `curly_braces_in_flow_control_structures`.
- Consumed the Riverpod `ref.refresh(...)` result in the live order refresh path to satisfy the `unused_result` analyzer rule without changing refresh behavior.
- No payment, refund, routing, Web, API, or database behavior changes.

## 0.52.24 - Phase 055.34.2: Flutter payment return no-flash refresh

- Fixed Flutter Order Details briefly flashing into a loading state during Stripe payment reconciliation and background order refreshes.
- Payment reconciliation, manual refresh, and live refresh now use Riverpod `ref.refresh(...future)` so the existing order screen remains available while fresh data is fetched.
- Keeps `Confirming payment...` active until confirmed order data has refreshed, then clears the local reconciliation state.
- Preserves the Phase 055.32 root-navigator baseline and Phase 055.34.1 dedicated payment reconciliation flow.
- No Web Storefront, API, Prisma, refund, or return behavior changes.

## 0.52.22 - Phase 055.34: Payment and refund state UX

## 0.52.23 - Phase 055.34.1: Dedicated payment reconciliation

- Added authenticated `POST /payments/reconcile`; payment return confirmation no longer abuses payment creation/resume.
- Reconciliation is idempotent and never creates a new checkout session.
- Provider PAID confirms the order, PROCESSING remains non-actionable, EXPIRED is marked failed, and OPEN/UNPAID remains eligible for a real payment action.
- Web automatically reconciles `?payment=success`, suppresses Pay/Cancel during confirmation, and retries short provider lag before refreshing.
- Flutter automatic confirmation now calls the same reconciliation endpoint instead of `createPayment`.
- No Prisma migration is required; Phase 055.32 routing remains untouched.

- Unified Web and Flutter payment wording: unpaid orders use `Pay now`; paid state is presented as `Payment received`.
- Flutter disables duplicate payment actions while the bounded Stripe confirmation/reconciliation window is active and shows `Confirming payment...`.
- Reworked refund presentation so requested, processing, refunded, rejected and failed states are treated as explicit financial workflow states.
- Clarified that refund and inventory/return handling are separate workflows.
- Preserved the Phase 055.32 root-navigator routing baseline; no router changes are included.
- No database migration is required; existing PaymentStatus, RefundStatus and ReturnStatus persistence remains unchanged.

## 0.52.21 - Phase 055.33.2: Stripe confirmation retry window

- Fixes the remaining case where automatic reconciliation ran only once, before Stripe had finished marking the Checkout Session as paid.
- Pending Stripe payments are now reconciled automatically for a bounded 20-second window after the order page opens.
- Each retry re-reads the current order, asks the existing payment endpoint to reconcile the provider session, and stops immediately once the order/payment is no longer pending.
- Stripe processing/webhook timing no longer requires the customer to press `Continue payment` merely to trigger a second provider-status check.
- Does not reopen Stripe Checkout and keeps genuine unpaid payment recovery available after the bounded confirmation window.
- Preserves the Phase 055.32 navigation baseline.

## 0.52.20 - Phase 055.33.1: Automatic pending-payment reconciliation

- Reconciles an existing pending payment automatically whenever the Flutter order details page opens, instead of depending on the browser retaining `?payment=success`.
- This mirrors the provider-status check that previously only happened after pressing `Continue payment`, but does not reopen the checkout URL.
- A Stripe payment that is already paid is therefore confirmed by the backend and the order is refreshed without requiring a second customer click.
- Genuine unpaid Stripe sessions remain pending and the normal `Continue payment` recovery action remains available.
- Keeps Phase 055.32 navigation unchanged.

## 0.52.19 - Phase 055.33: Stripe return payment reconciliation

- Detects the Flutter Web Stripe success return (`?payment=success`) when an order detail page is opened.
- Reuses the existing payment creation/resume endpoint to reconcile the pending Stripe Checkout Session with the provider.
- Refreshes the order and customer order list immediately after reconciliation so a paid order no longer remains on the `Continue payment` recovery state while waiting for the webhook UI refresh.
- Does not reopen Stripe Checkout during return reconciliation and preserves the existing payment recovery flow for genuinely unpaid orders.
- Preserves the Phase 055.32 root-Navigator routing architecture and existing Stripe return URL handling.

## 0.52.18 - Phase 055.32: Root-Navigator customer routes

- Removed `ShellRoute` completely from the Flutter customer navigation graph.
- Customer bottom-navigation destinations now render `MainShell` directly from ordinary `GoRoute` builders.
- Leaves only the root GoRouter Navigator, eliminating the remaining shell-level nested Navigator/HeroControllerScope path.
- Preserves customer URLs, authentication guards, staff routes, Store & Support routes, and Flutter Web Stripe return handling.
- Targets the confirmed duplicate Page-key assertion that persisted after the earlier shell and auth-refresh fixes.

## 0.52.17 - Phase 055.31.1: Remove auth-triggered router refresh

- Removed the manual `appRouter.refresh()` call from the auth-state listener.
- Keeps the auth listener responsible only for push-registration lifecycle work.
- Prevents an auth-state transition from forcing a second GoRouter page-list rebuild while the current route is already updating.
- Preserves the Phase 055.31 single-Navigator customer shell and all existing route definitions.
- Targets the confirmed Web runtime assertion in `Navigator._debugCheckDuplicatedPageKeys` (`navigator.dart:4068`) originating from GoRouter's `HeroControllerScope`.

## 0.52.16 - Phase 055.31: Single-Navigator customer shell

- Replaced `StatefulShellRoute.indexedStack` with a plain `ShellRoute` for the four customer tabs.
- Removed the four branch `GlobalKey<NavigatorState>` instances and the `StatefulNavigationShell`/`goBranch` navigation path.
- MainShell now receives the active route and child directly, derives the selected bottom-navigation destination from the location, and switches tabs with `context.go`.
- Preserves Home, Cart, Orders, Profile, product details, wishlist, order details, auth redirects, staff routes, Store & Support routes, and Flutter Web Stripe initial-location handling.
- Targets the confirmed runtime failure in go_router's `HeroControllerScope` where the Navigator receives duplicate Page keys (`navigator.dart:4068`, `!keyReservation.contains(key)`).
- Trade-off: customer tabs no longer retain independent nested Navigator stacks when switching tabs; this deliberately removes the StatefulShell navigator layer responsible for the duplicate-page-key failure.

## 0.52.15 - Phase 055.30.3: Unified Store & Support routing

- Replaced Profile → Store & Support local `MaterialPageRoute` navigation with GoRouter.
- Registered Store & Support, information sections, and branch details as explicit routes outside the stateful bottom-navigation shell.
- Replaced Store & Support's nested local Navigator pushes with GoRouter paths while preserving the existing pages and UI.
- Includes the Profile ListTile Material-surface correction from Phase 055.30.2.
- Preserves Flutter Web initial-location/Stripe return behavior, authenticated shell routes, StoreInfo provider, API behavior, and customer content.
- Removes mixed local Navigator/go_router navigation from the Profile → Store & Support flow that was active around the runtime Navigator page-key assertion.

## 0.52.13 - Phase 055.30.1: Stable shell navigator keys

- Assigned an explicit, unique `GlobalKey<NavigatorState>` to each `StatefulShellBranch` instead of relying on generated branch navigator keys.
- Added debug labels for the root, Home, Cart, Orders, and Profile navigators to make future navigation assertions identifiable.
- Keeps the Phase 055.30 route-level authentication redirects and existing Flutter Web initial-location/Stripe return behavior unchanged.
- Targets the Flutter red screen reporting the same generated Navigator GlobalKey being instantiated more than once under `HeroControllerScope`.

## 0.52.12 - Phase 055.30: Flutter auth navigation red-screen fix

- Moved protected-route navigation decisions into GoRouter `redirect` instead of calling `context.go()` from route widgets after build.
- Added centralized authenticated/staff route checks for Profile, Cart, Orders, Wishlist, Checkout, account utilities, and Staff routes.
- Kept the existing route guard widgets only as render gates while authentication is being restored.
- Refresh GoRouter when authentication status or staff access changes so redirects stay synchronized with Riverpod auth state.
- Preserved the Flutter Web initial-location/Stripe return behavior, existing routes, `returnTo`, UI, and authentication API behavior.
- Fixes the Navigator GlobalKey reservation red screen caused by post-frame navigation during protected route rebuilds.

## 0.52.11 - Phase 055.29.2: Flutter Web Enter-key interception

- Added an explicit Email focus node keyboard handler for Enter and Numpad Enter.
- Email Enter is now handled at the focus/key-event level and immediately transfers focus to Password.
- Removed Email `onFieldSubmitted` to avoid duplicate keyboard processing on Flutter Web/Desktop.
- Password Enter remains the only keyboard path that submits sign-in.
- No authentication, API, routing, or visual design behavior was changed.

## 0.52.10 - Phase 055.29.1: Flutter sign-in focus hotfix

- Replaced implicit focus traversal with an explicit Password `FocusNode` so pressing Enter in Email reliably focuses Password on Flutter Web/Desktop.
- Prevented the Email Enter action from accidentally advancing past Password and triggering form validation.
- Kept Password Enter as the only keyboard action that submits the sign-in form.
- No authentication, API, routing, or visual design behavior was changed.

## 0.52.09 - Phase 055.29: Flutter sign-in keyboard flow

- Fixed the Flutter sign-in form so submitting the Email field moves focus directly to Password.
- Added explicit `TextInputAction.next` for Email and `TextInputAction.done` for Password.
- Preserved the existing Password Enter behavior so submitting Password still runs the existing sign-in flow.
- No authentication, API, routing, or visual design behavior was changed.

## 0.52.08 - Phase 055.28: Store information content cards

- Refined all customer-facing footer information pages with consistent soft-grey content cards instead of flat text blocks.
- Applied the card treatment across Delivery, Returns, Contact us, FAQ, Trust & safety, Terms, Privacy and the About store description.
- Preserved the existing Store details sidebar, branch directory, dynamic merchant content, structured delivery/returns settings, routes and backend behavior.
- Added a dedicated content-style module so the existing Store Information stylesheet is not overwritten or regressed.

## 0.52.07 - Phase 055.27: Staff Center section switcher

- Reorganized the existing Flutter Staff Center into three internal switchable sections directly below the existing hero.
- Operations is the default first section and keeps the existing workspace actions unchanged.
- Owner snapshot is the second section and keeps the existing PostgreSQL-backed sales metrics unchanged.
- Commerce health is the third section and keeps the existing operational health metrics unchanged.
- No new dashboard features, API changes, database changes, or customer-facing changes were introduced.

## 0.52.06 - Phase 055.26.1: Flutter Staff Settings helper scope hotfix

- Fixed the Phase 055.26 Flutter analyzer errors caused by duplicated delivery/returns hint helpers being inserted into the `_Section` widget.
- Keeps the hint helpers only in `_StaffStoreSettingsPageState`, where the form controllers are available.
- No API, database, Stripe, checkout, or customer-facing behavior changed.

## 0.52.05 - Phase 055.26: Professional delivery and returns staff settings

- Split Staff Settings into clear Commerce defaults, Delivery settings, and Returns settings sections on Web and Flutter.
- Added contextual field guidance for currency, timezone, estimated delivery, return condition, and refund method.
- Added live human-readable shipping and free-delivery amount hints while preserving cents as the backend storage format.
- Added return-window guidance so zero and positive values have clear customer-facing meaning.
- Preserved the Phase 055.25 structured settings API, database fields, customer pages, Stripe, and checkout behavior.

## 0.52.04 - Phase 055.25.2: Deduplicate StoreSettings serializers

- Removed the duplicate `toPublic()` implementation introduced by the previous hotfix.
- Kept exactly one `toStaff()` and one `toPublic()` implementation in `StoreSettingsService`.
- Preserved the new structured delivery and returns fields in public serialization.
- No database, Stripe, checkout, Web UI, or Flutter UI changes.

## 0.52.03 - Phase 055.25.1: Restore StoreSettings service serializers

- Restored `toStaff()` and `toPublic()` in `StoreSettingsService` after the Phase 055.25 service baseline accidentally omitted them.
- Public serialization includes the new structured delivery and returns fields.
- No database, Stripe, checkout, Web UI, or Flutter UI changes.

## 0.52.02 - Phase 055.25: Structured delivery and returns settings

- Added merchant-managed `Estimated delivery`, `Return window`, `Return item condition`, and `Refund method`.
- Added an additive StoreSettings migration for the four structured fields without removing existing policy content.
- Connected the fields through API, Web Staff, Flutter Staff, Web customer pages, and Flutter Store & Support.
- Delivery now separates price, free-delivery threshold, estimated timing, and delivery information.
- Returns now separates return window, item condition, refund method, and returns information.
- Updated demo seed values. No Stripe or checkout calculation changes.

## 0.52.01 - Phase 055.24: Professional Web branch details

- Upgraded Web `Our Store` branch details to match the richer Flutter branch-detail experience.
- Added a stronger store hero with branch identity, address, description, and a clearer `PRIMARY STORE` badge.
- Replaced the old plain metadata list with dedicated Address, Business hours, and Contact cards.
- Added customer actions for `Call store` and `Get directions`; directions open Google Maps search using the branch address.
- Preserved the existing square swipeable branch photo carousel, drag/swipe behavior, navigation dots, and photo counter.
- No API contract, database schema, Store Settings model, media storage, Stripe, checkout, or Flutter behavior changes.

## 0.52.00 - Phase 055.23.1: Remove obsolete Flutter store helper

- Removed the unused legacy `_InfoLine` widget after Store & Support and branch details moved to the newer information-card components.
- Resolves the Flutter analyzer `unused_element` warning at `store_support_page.dart`.
- No UI behavior, API, database, Store Settings, media, Stripe, checkout, or routing changes.

## 0.51.99 - Phase 055.23: Professional Flutter branch details

- Upgraded Flutter Our Store branch details into a richer store-visit experience while preserving the existing multi-branch and eight-photo gallery behavior.
- Added a dark branch hero panel with store identity, branch address, description, and a clearer acid-lime `PRIMARY STORE` badge.
- Replaced the old single information card with dedicated Address, Business hours, and Contact cards for stronger hierarchy and scanning.
- Added `Call store` using the existing `url_launcher` dependency when a branch phone number is available.
- Added `Directions` using Google Maps search in the external browser/app when a branch address is available.
- Preserved the existing square swipeable gallery, wrapped thumbnails, selected state, and photo counter.
- No API contract, database schema, Store Settings model, media storage, Stripe, checkout, or Web behavior changes.

## 0.51.98 - Phase 055.22.1: Separate Web delivery information

- Added 32px separation between the delivery pricing summary and the merchant-managed Delivery information.
- Added a dedicated `Delivery information` heading so policy copy no longer visually sticks to the free-delivery threshold.
- No API, database, Flutter, Stripe, checkout, or Store Settings behavior changes.

## 0.51.97 - Phase 055.22: Rich Flutter Store & Support information pages

- Upgraded Flutter Store & Support detail pages from plain title-and-text layouts into a consistent ecommerce information system while preserving the existing black, white, and acid-lime visual language.
- Added section hero panels, stronger information hierarchy, reusable information cards, reading cards, highlights, metrics, and section labels.
- Delivery now presents shipping price and free-delivery threshold as visual summary cards before the dynamic delivery policy.
- Contact us now presents email, phone, and support hours as dedicated support cards.
- FAQ now renders Store Settings FAQ content as expandable accordion cards without hard-coding merchant answers.
- Returns now includes a visual return-guidance callout followed by the merchant-managed return policy.
- Trust & safety now includes account, payment, and shopping-safety feature cards followed by the merchant-managed safety content.
- Terms and Privacy now use dedicated reading surfaces and section hierarchy instead of a bare text block.
- Our Store now receives the same richer page header and location count while preserving the existing clickable multi-branch cards and branch photo experience.
- Existing Store Settings remain the source of truth; no API contract, database schema, media storage, Stripe, checkout, routing, or branch-photo logic changes.

## 0.51.96 - Phase 055.21.1: Retail-design demo branch photos

- Replaced the generic random Picsum branch placeholders with a curated set of real retail/boutique interior photos from Unsplash for demo UI review.
- The preview set focuses on store design: retail floor layout, shelving, clothing racks, display areas, architectural details, and merchandising.
- Each demo branch still has eight photos (one cover plus seven gallery photos), with a different starting cover/order per branch so multi-location cards do not all look identical.
- Image URLs request square 1200×1200 crops to match the existing 1:1 branch-photo presentation.
- This remains demo seed data only; no generated images, schema migration, API contract, Web UI, Flutter UI, Stripe, checkout, or media-storage changes.

## 0.51.95 - Phase 055.21: Store information demo data

- Added a rerunnable demo-content seed script for Store Settings and customer information pages.
- Populates Delivery, Returns, Contact us, FAQ, Trust & safety, Terms, and Privacy with realistic preview content.
- Adds four active Malaysian demo branches: Kuala Lumpur, Petaling Jaya, Subang Jaya, and Johor Bahru.
- Each demo branch contains a description, address, phone, business hours, one cover photo, and seven gallery photos so the 8-photo branch UI can be reviewed.
- Demo photos use remote placeholder image URLs for UI preview only; no generated photos or production media are added.
- Added a cleanup script that removes only the four deterministic demo branch rows.
- No schema migration, API contract, Web UI, Flutter UI, Stripe, checkout, or media-storage changes.

## 0.51.94 - Phase 055.20.3: Connect Flutter Delivery page to shipping settings

- Connected Flutter `Store & Support → Delivery` to the existing store shipping settings.
- The Flutter Delivery page now shows `Standard delivery` using the configured store currency and amount.
- `Free delivery` is shown as `Orders over ...` when the configured free-shipping threshold is greater than zero.
- Kept `Delivery information` as the descriptive content beneath the shipping summary.
- Currency and timezone remain internal Store Settings rather than customer-facing fields.
- No Web, API, database, media upload, Stripe, checkout calculation, or routing changes.

## 0.51.93 - Phase 055.20.2: Connect shipping settings to Delivery page

- Connected the customer-facing Web `Delivery` page to the existing store shipping settings.
- `Standard shipping` is now presented as `Standard delivery` with the configured store currency and amount.
- `Free shipping threshold` is shown as `Free delivery — Orders over ...` when the configured threshold is greater than zero.
- Kept `Delivery information` as the main descriptive content on the Delivery page.
- Kept Currency and Timezone as internal Store Settings rather than customer-facing Store details.
- Removed the obsolete empty metadata wrapper from the Web Store details card.
- No API, database, Flutter, Stripe, checkout calculation, media upload, or routing changes.

## 0.51.92 - Phase 055.20.1: Stack Store details social links

- Changed the Web `Store details` social links to a fixed vertical order: Instagram, Facebook, TikTok.
- Each configured social link now occupies its own row instead of wrapping side by side.
- Preserved Store Logo, Store Name, shipping/checkout behavior, API, database, Flutter, and routing.

## 0.51.91 - Phase 055.20: Remove shipping from Web Store details

- Removed `Standard shipping` from the customer-facing Web `Store details` card.
- Removed the related `Free shipping from` row from the same card so checkout/shipping pricing is not mixed into store identity details.
- Preserved Store Logo, Store Name, Instagram, Facebook, TikTok, backend shipping settings, and checkout shipping behavior.
- No Flutter, API, database, media upload, Stripe, checkout calculation, or routing changes.

## 0.51.90 - Phase 055.19.5.3: Wrapped Flutter branch photo thumbnails

- Kept the full branch photo set, including cover plus gallery photos; the 8-photo case remains supported.
- Replaced the horizontally scrolling Flutter thumbnail strip with a wrapping thumbnail layout so thumbnails automatically continue onto the next line when width is insufficient.
- Removed the thumbnail `ScrollController` and its auto-scroll logic because wrapped thumbnails no longer need horizontal scrolling.
- Preserved the main swipeable `PageView`, thumbnail-to-main-photo navigation, selected-thumbnail state, and `x/y` counter.
- No Web, API, database, upload, Stripe, checkout, or routing changes.

## 0.51.89 - Phase 055.19.5.2.2: Collection literal analyzer fix

- Replaced the branch photo deduplication construction with a Dart set collection literal to satisfy `prefer_collection_literals`.
- Preserved the complete cover-plus-gallery photo set, deduplication, carousel counter, and thumbnail synchronization.
- No Web, API, database, upload, Stripe, checkout, or routing changes.

## 0.51.88 - Phase 055.19.5.2.1: Flutter collection lint hotfix

- Resolved the `prefer_collection_literals` analyzer finding in the Flutter branch photo composition.
- Preserved the complete cover-plus-gallery photo count, URL deduplication, thumbnail synchronization, carousel behavior, and all existing Web/API/database/payment behavior.

## 0.51.87 - Phase 055.19.5.2: Normalize complete branch photo carousel

- Normalized Flutter branch-detail photo composition so `coverUrl` is explicitly treated as the first carousel photo and gallery photos follow it.
- The complete branch photo set is now built from cover plus gallery, with whitespace normalization before deduplication.
- A cover URL duplicated inside the gallery is still displayed only once.
- Preserved thumbnail auto-follow, `x/y` counter synchronization, 1:1 `cover` presentation, Web behavior, API, database, media upload, Stripe, checkout, and routing contracts.

## 0.51.86 - Phase 055.19.5.1: Flutter branch thumbnail auto-follow hotfix

- Added a dedicated horizontal thumbnail `ScrollController` to the Flutter branch photo carousel.
- Swiping the main photo now automatically scrolls the thumbnail strip so the selected thumbnail remains visible, including the final photo.
- Tapping a thumbnail keeps the main `PageView`, selected thumbnail, thumbnail viewport, and `x/y` counter synchronized.
- Preserved the Phase 055.19.5 carousel design, 1:1 `cover` photos, Web behavior, API, database, media upload, Stripe, checkout, and routing contracts.

## 0.51.85 - Phase 055.19.5: Swipeable branch photo carousel

- Replaced the Flutter branch-detail static lead-photo plus thumbnail strip with a real swipeable `PageView` photo carousel.
- Flutter now supports finger/mouse swipe between 1:1 branch photos, tappable square thumbnails, selected-thumbnail state, and a current-photo counter.
- Replaced the Web branch-detail photo grid with a horizontal 1:1 snap carousel.
- Web now supports touch swiping, trackpad horizontal scrolling, mouse drag-to-scroll, snap-to-photo behavior, dot navigation, and a photo counter while keeping the native scrollbar hidden.
- Preserved the Phase 055.19.4 square 1:1 `cover` presentation and existing branch data, upload behavior, API, database, Stripe, checkout, and routing contracts.

## 0.51.84 - Phase 055.19.4: Square store photo presentation

- Standardized store and branch photo presentation to a 1:1 square frame, matching a 1024 x 1024 recommended upload format.
- Switched Web and Flutter store photos back to crop-to-fill (`cover`) so square frames are filled cleanly; non-square source images may be cropped.
- Applied the square treatment to branch directory thumbnails, branch detail galleries, Flutter customer branch photos, and Flutter Staff branch photo previews.
- Upload storage is unchanged: this phase changes presentation only and does not resize or rewrite the uploaded source file.
- API, database, Stripe, checkout, routing, branch data, and media upload endpoints are unchanged.

## 0.51.83 - Phase 055.19.3: Preserve full store photos

- Changed Web and Flutter store/branch photo rendering from crop-to-fill to fit-inside so uploaded photos are shown in full without cutting off edges.
- Applied the no-crop behavior to the Web branch directory thumbnail, Web branch detail gallery, Flutter customer branch directory/detail gallery, and Flutter Staff branch photo previews.
- Added neutral image backdrops where fixed preview frames can leave unused space for photos with different aspect ratios.
- Store locations, branch data, API, database, Stripe, checkout, routing, and upload behavior are unchanged.

## 0.51.82 - Phase 055.19.2: Remove duplicate Store details support hours

- Removed only the `Support hours` row from the Web Our Store page's right-side Store details card.
- Branch business hours remain unchanged in the branch directory and branch detail page.
- Store name, standard shipping, social links, logo treatment, multi-branch navigation, API, database, Flutter, Stripe, and routing are unchanged.

## 0.51.81 - Phase 055.19.1: Flutter store locations syntax hotfix

- Rewrote the Flutter Staff Store Locations panel into valid, formatted Dart after the Phase 055.19 dialog layout introduced an unmatched parenthesis.
- Added block bodies around loop and conditional statements so `flutter analyze` no longer reports the two `curly_braces_in_flow_control_structures` findings from this file.
- Preserved the existing branch CRUD, per-branch introduction, photo upload, cover selection, active/primary state, and customer-facing branch behavior.
- No API, database migration, Web storefront, Stripe, checkout, order, inventory, or routing behavior changed.

## 0.51.80 - Phase 055.19: Click-through branch directory

- Reworked customer-facing Our Store from large stacked branch detail cards into compact clickable branch rows: branch image on the left, branch name/address/hours/contact in the middle, and a clear chevron on the right.
- Added a dedicated Web branch detail page for each Store Location with its own introduction, full photo gallery, address, business hours, and contact number.
- Added a per-branch `description` field through a forward migration and Staff editing on both Web and Flutter.
- Updated Flutter Our Store to use the same directory-first interaction: compact tappable branch rows open a dedicated branch detail screen with introduction, photos, address, hours, and contact.
- Kept each branch's photos isolated from every other branch and retained primary/active location behavior.
- No Stripe, checkout, order, inventory, authentication, or payment behavior changed.

## 0.51.79 - Phase 055.18: Multi-branch Store Locations

- Replaced the single-address/single-photo mental model with first-class Store Locations so one merchant can manage one or many physical branches.
- Added a StoreLocation database table and a safe migration that seeds a primary location from the existing address, hours, phone, cover, and gallery fields when legacy store data exists.
- Added authenticated Staff location CRUD APIs plus public location data in `/store-info`; Store Settings remains the single source for store-wide brand, support, commerce, policy, and social data.
- Added Web Staff branch management with per-branch name, address, phone, hours, active/primary state, and branch-specific photos.
- Updated the Web Our Store customer page to render locations separately so photos and addresses never mix across branches.
- Added Flutter StoreInfo location parsing and customer Our Store branch cards with branch-specific address, hours, phone, cover, and gallery.
- Added Flutter Staff location management using the existing Staff API client and store-media upload path.
- Kept the legacy StoreSettings location/photo columns for backward compatibility during the transition; new customer presentation prefers Store Locations.
- No Stripe, checkout, order, inventory, authentication, or router behavior changed.

## 0.51.78 - Phase 055.17: Store details logo placement

- Moved the customer-facing Store Logo presentation into the Store details card instead of the storefront footer.
- Shows the uploaded logo beside Store Name with a compact, contained treatment that does not compete with store photography.
- Keeps the card clean when no logo is configured by rendering no empty placeholder.
- Web Header, Web Footer, Flutter customer UI, API, database, Stripe, checkout, and routing remain unchanged.

# Changelog

## 0.51.77 - Phase 055.16: Remove Store Logo from customer footer

- Removed the uploaded Store Logo from the customer-facing Web footer after the visual review.
- Restored the cleaner generated brand-mark fallback in the footer while keeping Store Name, tagline/description, country, currency, and customer information links driven by shared Store Settings.
- Kept Store Logo upload, replace, preview, and remove controls in Staff Settings so the asset remains available for future brand use without appearing on the customer experience.
- No API, database, Flutter customer UI, checkout, Stripe, router, or order behavior changed.

## 0.51.76 - Phase 055.15: Store logo in Web footer

- Connected the managed Store Logo to the customer-facing Web footer brand area.
- The footer now displays the uploaded logo beside Store Name when configured.
- Preserved the existing generated brand-mark fallback when no logo is uploaded.
- Kept the Web header and Flutter customer experience unchanged so the logo remains footer-only as agreed.
- Reused the public store-info contract; no database migration or API change is required.

## 0.51.75 - Phase 055.14: Managed Store Logo upload

- Replaced the technical `Logo URL` field in Web and Flutter Staff Settings with a real Store Logo manager.
- Staff can now upload, replace, preview, or remove the logo without seeing or editing media URLs manually.
- Reused the existing validated Store media upload pipeline so logo files remain managed by the shared API and the persisted `logoUrl` stays an internal implementation detail.
- Preserved the unified Store Photos workflow, Store Settings data contract, checkout, Stripe return routing, and customer commerce flows.

## 0.51.75 - Phase 055.13: Unified Our Store photo manager

- Replaced separate cover and gallery upload controls with one Store Photos manager on Web and Flutter Staff Settings.
- The first store photo is now the Our Store cover automatically; merchants can promote another photo to cover or delete photos without seeing or editing raw media URLs.
- Added multi-file selection on Web, a single eight-photo limit, cover badges, photo previews, and automatic cover promotion when the current cover is removed.
- Kept the existing API/database cover and gallery fields internally for compatibility while simplifying the merchant-facing workflow.
- No checkout, payment, order, Stripe return, or customer routing behavior was changed.

## 0.51.74 - Phase 055.12.1: Store gallery response hotfix

- Fixed Staff Settings gallery responses so `storeGalleryUrls` is returned as a real string array instead of the database JSON text value.
- Added defensive Storefront normalization for older/stale API responses so the Settings page cannot crash on `.map()` when gallery data arrives as JSON text.
- Kept Staff GET/PATCH response contracts aligned with the Web and Flutter domain models.
- Cleaned the two Flutter curly-brace lint findings introduced in Phase 055.12.

## 0.51.73 - Phase 055.12: Our Store photos and location

- Rebuilt Our Store as a real merchant profile with a cover photo, up to eight gallery photos, store description, full store location, and business hours.
- Moved the physical address out of Contact Us; Contact Us now focuses on customer support email, phone, and support hours.
- Added authenticated Staff store-photo uploads for JPG, PNG, and WebP files with signature validation and an 8 MB limit, reusing the existing media-storage architecture.
- Added Store Settings cover/gallery controls on Web and Flutter so merchant content is still managed from the shared Settings source of truth.
- Added public store-photo delivery and shared Store Info fields so both Web Our Store and Flutter Our Store display the same saved content.
- Added a forward database migration for store cover and gallery data without changing checkout, payments, orders, or Stripe return routing.

## 0.51.72 - Phase 055.11: Settings-driven Storefront footer

- Connected the Storefront footer directly to the shared public Store Settings API instead of keeping merchant-facing identity text hard-coded in the layout.
- Store name, footer description/tagline, country, and currency now update from the same Settings record used by the Web and Flutter customer information pages.
- Added a resilient server-side footer fallback so a temporary Store Info API failure does not take down the whole Storefront layout.
- Preserved the real Shop, Help, and About routes introduced in Phase 055.10 and did not change checkout, Stripe return handling, Staff workflows, or Flutter routing.

## 0.51.71 - Phase 055.10: Real customer information and support

- Replaced the Storefront footer's placeholder Help/About links with real customer information routes for delivery, returns, contact, FAQ, store details, trust & safety, terms, and privacy.
- Reworked Footer Shop links so they drive the existing live catalog filters instead of pointing several labels at the same placeholder anchor.
- Added a public `/store-info` API backed by the shared Store Settings record, exposing only customer-facing shop information.
- Expanded Store Settings with public store profile, business hours, delivery/returns information, FAQ, trust & safety, legal content, and social links.
- Added responsive Storefront customer information pages that read the same backend values edited in Staff Settings.
- Added Flutter `Profile -> Store & Support` for both signed-in and signed-out customers, with native pages for the same store, delivery, returns, contact, FAQ, trust, terms, and privacy content.
- Preserved existing Staff dashboard, orders, returns, catalog, categories, promotions, inventory, payment, Stripe checkout return handling, and authentication flows.

## 0.51.70 - Phase 055.9: Owner dashboard sales and shared store settings

- Added real Staff dashboard sales metrics backed by PostgreSQL order and refund data, including today's orders, gross sales, refunds, net sales, monthly sales, and average order value.
- Added a singleton Store Settings backend with shared shop identity, contact, currency, timezone, and shipping configuration.
- Added Store Settings management to the Storefront Staff console and Flutter Staff Center, both using the same API and PostgreSQL record.
- Added a Storefront `/staff/settings` page and authenticated BFF proxy route.
- Added a Flutter Store Settings workspace and connected it from Staff Center.
- Preserved the existing Staff orders, returns, catalog, categories, promotions, inventory, payment, and Stripe return flows.

## 0.51.69 - Phase 055.8: Storefront Staff overview route

- Added the missing `/staff` Storefront route and connected it to the existing `StaffDashboard`.
- Restored the Staff `Overview` navigation entry so it no longer resolves to a 404 page.
- Reused the existing Staff dashboard metrics, quick actions, navigation, and styling instead of introducing a parallel dashboard implementation.
- No Staff orders, catalog, categories, promotions, returns, payment, Stripe, Flutter, Prisma, or API behavior changed.
