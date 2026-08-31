# Changelog

All notable changes to TextShop will be documented in this file.

## [0.34.0] - 2026-08-31

### Added
- Dedicated Website Orders Center at `/account/orders`.
- Order status filters for All, Awaiting payment, Confirmed, Fulfilled, Cancelled, and Expired.
- Purchase search by order number, product name, variant name, and SKU.
- Rich order cards with product images, product names, variants, SKUs, quantities, line totals, delivery summary, payment state, order state, and total.
- Direct `Continue payment`, `Cancel order`, and `View details` actions where appropriate.
- Loading, empty, no-match, refresh, and error states for the Orders Center.

### Changed
- The Website Purchases header action now opens `/account/orders` directly instead of scrolling into the general Account page.
- Account now shows only the three most recent orders plus `View all orders`, keeping profile/address management separate from purchase history.
- Account order-list payload now includes trusted order-item SKU/pricing snapshots plus current catalog media/product slug when available.
- Cancellation can refresh the Orders Center in place after a successful cancellation.

### Architecture & Security
- Product names, SKU, quantity, unit price, line total, totals, status, payment state, and shipping summary remain server-owned order data.
- Catalog images and product slugs are enrichment only; historical commercial values continue to come from immutable OrderItem snapshots.
- Existing order ownership authorization and cancellation rules are unchanged.
- No Prisma migration is required.

## [0.33.4] - 2026-08-31

### Fixed
- Normalized Website Wishlist, Account, Purchases, and Cart icons to the same fixed icon box, SVG size, stroke weight, line height, and vertical center.
- Replaced the remaining text/emoji commerce icons with a single SVG icon system so browser font metrics no longer make individual actions appear taller or lower.
- Preserved the Wishlist saved-count badge and existing purchase-history navigation behavior.

### Changed
- All four commerce header actions now share a `28px` icon container with a `22px` SVG glyph and a consistent minimum action height.
- Added a reusable `HeaderActionIcon` component for future header actions.
- No Prisma migration is required.

## [0.33.3] - 2026-08-31

### Fixed
- Removed the oversized circular treatment around the Website purchase-history icon.
- Matched the purchase-history header action to the same icon + two-line label structure used by Wishlist, Account, and Cart.
- The header no longer displays the word `Orders`; the action is presented as `Your / Purchases` beside the receipt icon.
- Preserved reliable `/account#orders` navigation and same-page smooth scrolling.

### Changed
- The receipt icon now inherits the shared `header-action` sizing, spacing, hover behavior, and responsive layout.
- No Prisma migration is required.

## [0.33.2] - 2026-08-31

### Fixed
- Replaced the plain Website `Orders` text link with an icon-only receipt/order action.
- Fixed Orders navigation so clicking the icon from another page opens `/account#orders`.
- Fixed clicking the Orders icon while already on Account by scrolling directly to the Orders section instead of appearing unresponsive.
- Added accessible `aria-label` and hover title without showing the word `Orders` in the header UI.

### Changed
- Orders now behaves like the other compact commerce actions in the Website header instead of a standalone text navigation item.
- No Prisma migration is required.

## [0.33.1] - 2026-08-31

### Fixed
- Made Website purchase history substantially easier to discover from the customer account experience.
- Added a direct Website `Orders` shortcut beside the existing Account entry when using the shared storefront header.
- Added sticky Account section navigation for Overview, Orders, Addresses, and Profile where supported by the existing Account layout.

### Changed
- Account order history is visually promoted instead of being buried below profile/address management.
- Existing order cards retain their secure Order Details destination; product-level purchase information remains available from the full order details view.
- Account order cards now directly show purchased product names, selected variants, quantities, and a clear link into full Order Details.

### Architecture
- This UX increment does not duplicate order ownership logic or expose guest order tokens.
- Detailed order contents continue to come from trusted NestJS order resources rather than browser-owned purchase history.
- No Prisma migration is required.

## [0.33.0] - 2026-08-31

### Added
- First-class `Review` persistence with one customer review per product.
- Public real rating summary and verified customer review list.
- Website review composer/edit/delete workflow from Product Details.
- Flutter review summary, verified review list, and write/edit/delete workflow from Product Details.
- Purchase eligibility checks that only allow reviews after a paid `CONFIRMED` or `FULFILLED` order containing one of the product's variants.

### Changed
- Removed the remaining hard-coded `4.8 / 128 reviews` block from Website Product Details.
- Reviewer names are exposed publicly as first name plus last-name initial only.
- Rating averages and counts are computed from real review records rather than client-owned values.

### Security & Commerce Rules
- Creating or changing a review requires an authenticated account and a server-verified purchase.
- Review eligibility is derived from trusted paid order records and product variant IDs.
- Users can only delete their own reviews.
- Public review reads do not expose customer email, full surname, or order information.
- A Prisma migration is required for the new `Review` table.

## [0.32.1] - 2026-08-31

### Fixed
- Removed the duplicate catalog search field from the storefront product section.
- The header search is now the single canonical Website search entry point and lands directly on `#shop`.
- Category and sort filters preserve the active header search query through a hidden `q` parameter.
- Empty search results no longer incorrectly tell users to seed the database when live products already exist.
- Added the Next.js `data-scroll-behavior="smooth"` declaration to the root `<html>` element to match the existing smooth-scroll CSS and remove the route-transition development warning.

### Changed
- Catalog controls now focus only on Category and Sort.
- Homepage category tiles now link into the real catalog filter query instead of only scrolling to the product section.
- Filter forms and search forms both target the catalog anchor for a cleaner shopping flow.

### Architecture
- Search still remains server-backed through NestJS `/products`; this phase only unifies Website entry points and query-state handling.
- No Prisma migration is required.

## [0.32.0] - 2026-08-31

### Added
- Real catalog search, category filtering, and sorting on the Next.js storefront.
- NestJS `/products` query support for `q`, `category`, and `sort`.
- Product discovery across product name, description, category, variant name, and SKU.
- Flutter product sorting for newest, price low-to-high, price high-to-low, and name A–Z.

### Changed
- Website catalog controls use URL query parameters, making filtered results refreshable and shareable.
- Website category options come from the live `/categories` endpoint instead of inventing filter values.
- Flutter search now includes all variant names and SKUs instead of only the default variant.
- Removed the static `★★★★★ 4.8` storefront rating because TextShop does not yet have a real review/rating data source.

### Architecture
- Search/filter rules are enforced by NestJS for the Website while Flutter continues to filter its already-loaded live catalog locally for responsive interaction.
- Price sorting is based on each product's lowest active variant price.
- No Prisma migration is required.

## [0.31.0] - 2026-08-31

### Added
- Customer-initiated cancellation for unpaid orders that are still awaiting payment.
- Website cancellation confirmation from Order Details with support for both signed-in and existing guest order-access authorization.
- Flutter cancellation confirmation from authenticated Order Details.
- Immediate inventory-reservation release when a valid unpaid order is cancelled.

### Changed
- Pending payment records and payment attempts are marked failed with `ORDER_CANCELLED` when the customer cancels before payment.
- Cancelled orders clear `reservationExpiresAt`, preventing the expiration worker from processing them later.
- Website and Flutter order timelines refresh into the existing `CANCELLED` state after a successful cancellation.

### Security & Commerce Rules
- Paid, confirmed, fulfilled, expired, and already-cancelled orders cannot be customer-cancelled through this endpoint.
- Cancellation uses the same order ownership / signed guest-access authorization as secure order status.
- Inventory release and order/payment state changes execute in one serializable database transaction.
- No Prisma migration is required.
- The 30-minute reservation policy remains unchanged for orders that are not cancelled.

## [0.30.0] - 2026-08-31

### Added
- Full authenticated order-details experience on Flutter with `/orders/:orderNumber` navigation from My Orders.
- Product/SKU/quantity/line-total breakdown, subtotal, shipping, total, contact, and delivery-address details on both clients.
- Order lifecycle timeline for awaiting-payment, confirmed, fulfilled, cancelled, and expired states.
- Pull-to-refresh and explicit refresh support on Flutter order details.

### Changed
- The secure order-status API now returns shipping/contact metadata and the configured shipping method after existing order-access authorization succeeds.
- Website order status has been upgraded into a complete responsive order-details page.
- Flutter My Orders cards are now navigable while preserving the existing account-only order list.

### Security & Architecture
- Guest Website order access still requires the existing signed order-access token; signed-in customers are still authorized through their JWT session.
- Flutter order details use the existing authenticated NestJS route and never trust local order totals.
- No Prisma migration is required.
- The 30-minute inventory reservation policy is unchanged.

## [0.29.0] - 2026-08-31

### Added
- Saved-address selection directly inside the Website checkout for signed-in customers.
- Rich Website and Flutter order review lines with product media, selected variant/SKU, quantity, and line total.
- Dedicated checkout-blocked states when cart items are unavailable, sold out, or exceed current stock.

### Changed
- Editing Website delivery fields clears the selected saved-address state while keeping manual checkout available.
- Website checkout now exposes a direct path to manage the account address book.
- Both clients respect the Phase030 cart readiness signal before order creation.
- Checkout continues to perform authoritative server-side price, product, variant, and inventory validation.

### Architecture
- Standard delivery remains the only active shipping method; no fake shipping options were introduced.
- No Prisma migration or new backend pricing logic is required for this phase.
- The existing 30-minute inventory reservation policy is unchanged.

## [0.28.0] - 2026-08-31

### Added
- Product and variant availability diagnostics in both Website and Flutter carts.
- Variant SKU and live available-stock information in cart line items.
- Product/variant-aware cart thumbnails using the Phase029 media model.
- Cart-level checkout readiness state that blocks checkout while any line is unavailable, sold out, or exceeds current stock.

### Changed
- Quantity increase controls are disabled for invalid cart lines and continue respecting live stock and the maximum quantity of 99.
- NestJS cart responses now include ordered product media required for variant-aware cart presentation.
- Cart quantity updates now reject inactive variants and products before mutation, matching checkout validation.
- Cart totals continue using trusted variant prices returned by the backend.

### Architecture
- Existing checkout remains the final authority for stock, active-product validation, pricing, and order creation.
- The 30-minute inventory reservation policy is unchanged.
- No Prisma schema migration is required for this phase.

## [0.27.1] - 2026-08-31

### Fixed
- Updated storefront mock catalog fixtures to satisfy the Phase028/029 `Product.variants` contract.
- Preserved existing mock product IDs, prices, images, and display content while adding a compatible default mock SKU to each fixture.

## [0.27.0] - 2026-08-31

### Added
- Interactive multi-image product galleries on the Next.js storefront and Flutter product-details screen.
- Clickable storefront thumbnails and horizontally scrollable Flutter thumbnails with a selected-image state.
- Optional `ProductImage.variantId` support so a SKU can own variant-specific media while shared product images remain reusable.
- Automatic gallery switching when a customer changes the selected product variant.

### Changed
- Flutter product parsing now preserves the complete image collection instead of only the first image URL.
- Storefront product selection state is shared between the gallery and SKU purchase controls.
- Variant media falls back to shared product images when a SKU has no dedicated images.

### Database
- Added nullable `ProductImage.variantId` with a foreign key to `ProductVariant` and a variant/sort-order index.
- Existing product images remain valid and require no backfill because `variantId` is optional.

### Architecture
- Product-wide and variant-specific media now coexist without duplicating product records.
- Existing cart, pricing, inventory, checkout, payment, and 30-minute inventory reservation behavior is unchanged.

## [0.26.0] - 2026-08-31

### Added
- Real Product Variant / SKU selection on both the Next.js storefront and Flutter product-details experience.
- Variant-level SKU, price, compare-at price, available inventory, and stock state in shared client domain models.
- Storefront purchase selector that switches trusted displayed price and inventory as customers choose a variant.
- Flutter variant selector that sends the selected backend `variantId` when adding to cart.

### Changed
- Product catalog adapters now preserve every active variant returned by NestJS instead of collapsing products to `variants.first`.
- Default product pricing selects the first in-stock backend variant when possible while product cards indicate `From` pricing for multi-variant products.
- Out-of-stock variants remain visible for merchandising clarity but cannot be added to cart.
- Cart, checkout, order inventory validation, and server-controlled pricing remain authoritative.

### Architecture
- No Prisma migration was required: TextShop already models `ProductVariant` and `Inventory` as first-class commerce entities.
- The existing 30-minute checkout inventory reservation policy is unchanged.

## [0.25.2] - 2026-08-31

### Added
- Automatic storefront wishlist revalidation when the browser window regains focus.
- Automatic revalidation when a hidden browser tab becomes visible again.
- A lightweight 30-second visible-page fallback refresh so cross-device wishlist changes appear without requiring a manual browser refresh.

### Changed
- Background wishlist synchronization is silent and preserves the current UI instead of flashing the loading state.
- Concurrent wishlist refresh requests are deduplicated through a client-side single-flight guard.

### Architecture
- Cross-device wishlist synchronization continues to use PostgreSQL and the existing authenticated `/wishlist` API as the source of truth; no duplicate browser persistence or WebSocket layer was introduced.

## [0.25.1] - 2026-08-31

### Fixed
- Corrected malformed Flutter statements in the lifecycle and Wishlist-page synchronization hooks.
- Removed the accidental `void ref` tokens that prevented Dart parsing and triggered false dot-shorthand diagnostics.

## [0.25.0] - 2026-08-31

### Added
- Automatic Flutter wishlist synchronization when the app returns to the foreground or Flutter Web regains lifecycle focus.
- Server refresh whenever the Wishlist page is opened.
- Manual refresh button and pull-to-refresh support on the Flutter Wishlist page.
- Home pull-to-refresh now refreshes both live products and the signed-in account wishlist.

### Changed
- Added `WishlistController.refreshFromServer()` as the single reusable synchronization path for account-backed wishlist state.
- Remote refresh failures preserve the last known wishlist instead of wiping optimistic local state.

### Architecture
- Website and Flutter continue to use PostgreSQL `WishlistItem` as the source of truth; this phase adds client revalidation rather than a second local persistence layer or WebSocket dependency.

## [0.24.4] - 2026-08-31

### Fixed
- Moved Flutter `/wishlist` into the Home `StatefulShellBranch` instead of mounting it as a separate root-level route.
- Prevented wishlist state changes from rebuilding across two navigator topologies and triggering Flutter's duplicated page-key assertion (`!keyReservation.contains(key)`) on Web.
- Kept the public `/wishlist` URL unchanged while making Wishlist and product details use the same Home branch navigator stack.

## [0.24.3] - 2026-08-31

### Fixed
- Added server-side single-flight refresh-token rotation for concurrent Next.js BFF requests.
- Prevented Account, Wishlist, Orders, Addresses, Cart, and Checkout requests from racing each other with the same pre-rotation refresh cookie and incorrectly producing a second `401`.
- Kept completed refresh results available briefly so near-simultaneous requests can reuse the newly rotated token pair before the browser receives updated HttpOnly cookies.

### Architecture
- Website authentication remains a single shared HttpOnly-cookie session; Wishlist does not introduce a second login or client-visible token store.

## [0.24.2] - 2026-08-31

### Fixed
- Standardized all storefront Wishlist context imports to the same absolute module path.
- Prevented Turbopack from creating separate module identities for `WishlistProvider` and `useWishlist`, which caused product-card and product-detail controls to behave as if they were outside the provider.

## [0.24.1] - 2026-08-31

### Fixed
- Imported `AuthModule` into `WishlistModule` so NestJS can resolve the exported `JwtAuthGuard` and its `AuthService` dependency at runtime.
- Restored API startup for the authenticated Wishlist routes introduced in the account-backed wishlist flow.

## [0.24.0] - 2026-08-31

### Added
- Next.js account-backed Wishlist page using the same PostgreSQL wishlist records as Flutter.
- Same-origin Next.js BFF routes for listing, saving, and removing wishlist products without exposing access or refresh tokens to browser JavaScript.
- Shared client Wishlist provider so storefront cards, product details, the header count, and the Wishlist page stay synchronized in one browser session.
- Real save/remove controls on storefront product cards and product detail pages.

### Changed
- The header Wishlist action now opens the real Wishlist page and displays the signed-in account's saved-item count.
- Product-card media markup now keeps the wishlist button outside the product link, avoiding nested interactive controls.
- Signed-out wishlist actions route customers to sign in rather than creating misleading browser-only saved state.

### Architecture
- Web and Flutter now use the same authenticated NestJS Wishlist API and PostgreSQL `WishlistItem` source of truth.
- Browser authentication continues through the existing HttpOnly-cookie BFF architecture; wishlist tokens are never returned to client JavaScript.

## [0.23.1] - 2026-08-31

### Fixed
- Connected Flutter wishlist authentication checks to the app's existing `authControllerProvider` instead of referencing a non-existent `authSessionProvider`.
- Wishlist loading and mutations now derive signed-in state from the established `AuthState` architecture.

## [0.23.0] - 2026-08-31

### Added
- Account-backed wishlist persistence in PostgreSQL with a dedicated `WishlistItem` model and unique user/product constraint.
- Authenticated NestJS wishlist API for listing, saving, and removing products.
- Flutter API wishlist repository with optimistic save/remove updates.

### Changed
- Flutter wishlist state now loads from the signed-in account instead of being limited to the current app process.
- Storefront and product-detail heart actions now write through the authenticated backend and refresh with account state.

### Security
- Wishlist mutations derive customer identity from the verified JWT and never accept a client-supplied user ID.
- Only active products can be saved.

## [0.22.0] - 2026-08-31

### Added
- Flutter Wishlist entry point from the storefront header with a live saved-item badge.
- Save/remove wishlist actions on product cards and product details.
- Dedicated responsive Wishlist page using the live product catalog.

### Changed
- Product cards now support reusable wishlist presentation without coupling wishlist state into the card widget itself.
- Wishlist state is isolated behind Riverpod providers so it can later be replaced by account-backed persistence without redesigning storefront UI.

### Notes
- This phase intentionally keeps wishlist state in the running Flutter client only. Cross-device/account persistence is reserved for the backend wishlist phase rather than pretending local state is synchronized.

## [0.21.1] - 2026-08-31

### Fixed
- Removed an unused product-domain import from the Flutter storefront home.
- Simplified the nullable category heading with `??`, satisfying the current Flutter analyzer style rule.

## [0.21.0] - 2026-08-31

### Added
- Productized Flutter storefront home with responsive merchandising hero, live product grid, pull-to-refresh, loading/error/empty states, and adaptive desktop/mobile column counts.
- Client-side product search across product name, description, category, and variant name.
- Dynamic category filters generated from the live catalog.
- Reusable professional product card with live stock state, category, pricing, and image fallback.
- Responsive product details layout with live inventory status, stronger product information hierarchy, and trust messaging.

### Changed
- Flutter Home now behaves as a real shopping discovery surface instead of a feature-validation page.
- Product search and category selection are isolated in Riverpod state/providers rather than being embedded into page business logic.
- Product details now adapt between compact/mobile and wide/desktop layouts while preserving the existing real cart mutation flow.

## [0.20.2] - 2026-08-31

### Fixed
- Adjusted the Flutter `RadioGroup<String>` payment callback to always provide the required `ValueChanged<String?>` function while preserving the disabled-during-submit behavior.

## [0.20.1] - 2026-08-31

### Fixed
- Migrated Flutter checkout payment selection to the new `RadioGroup` API required by current Flutter releases.
- Migrated saved-address selection to `RadioGroup`, removing all six deprecated `RadioListTile.groupValue` and `RadioListTile.onChanged` analyzer notices.

## [0.20.0] - 2026-08-31

### Added
- Real Flutter checkout backed by the existing NestJS `POST /checkout` flow.
- Signed-in checkout prefill from the customer profile and saved Address Book, with guest/manual delivery entry still supported.
- Mobile order summary with the same RM 150 free-shipping threshold and RM 10 standard shipping charge as the backend.
- Flutter payment-session creation for MANUAL_TEST and Stripe.
- Debug-only MANUAL_TEST payment confirmation so the complete mobile order -> payment -> confirmed-order path can be tested locally.
- Stripe hosted-checkout launching from Flutter through `url_launcher`.
- Cart-to-checkout navigation and automatic cart/order refresh after payment actions.

### Changed
- Flutter Cart now exposes a real Checkout action instead of stopping at cart management.
- Payment test controls are hidden from release builds; production-facing builds use the real provider flow.
- Mobile checkout continues using the existing 30-minute inventory reservation window without changing backend lifecycle policy.

### Security
- Mobile checkout sends only customer-entered delivery data and the authenticated cart session to NestJS; trusted totals, shipping charges, inventory reservation, and payment amount remain server-controlled.
- MANUAL_TEST is exposed only in Flutter debug builds and is not presented as a release payment option.

## [0.19.0] - 2026-08-31

### Added
- Account-owned active carts in Prisma/NestJS so one signed-in cart is shared across website and Flutter clients.
- Automatic guest-cart claiming and merge-on-sign-in, with duplicate variants combined and capped by stock and the existing quantity limit.
- Auth-aware storefront cart BFF routes so HttpOnly account cookies participate in cart synchronization without exposing tokens to browser JavaScript.
- Real Flutter cart loading, quantity updates, removal, totals, refresh, and cross-device account synchronization.
- Flutter product catalog now reads the live NestJS product API and carries real variant/inventory identifiers needed for cart mutations.
- Flutter product details can add real product variants to the shared cart.

### Changed
- Authenticated cart operations resolve by account identity rather than by device-local cart session alone.
- Converted checkout carts release their account-cart ownership so the same customer can immediately receive a fresh active cart after placing an order.
- Storefront cart requests now flow through same-origin Next.js API routes before reaching NestJS.

### Security
- Browser cart synchronization keeps using server-held HttpOnly authentication cookies; access/refresh tokens are not exposed to storefront client code.
- Guest cart session identifiers remain untrusted hints and cannot override another signed-in customer's account cart.

## [0.18.2] - 2026-08-31

### Fixed
- Avoided `flutter_secure_storage` WebCrypto `OperationError` failures when the Flutter mobile client is exercised through Edge.
- Flutter Web development sessions now keep access and refresh tokens in memory, while Android and iOS continue using platform secure storage.

### Security
- Browser-persistent token storage is intentionally avoided for the Flutter Web development target; restarting or refreshing that target requires signing in again.
- The production Next.js storefront authentication model remains unchanged and continues using its server-side/HttpOnly-cookie flow.

## [0.18.1] - 2026-08-31

### Fixed
- Removed invalid const `Scaffold` usage around non-const `AppBar` constructors in Flutter Orders and Address Book loading states.

## [0.18.0] - 2026-08-31

### Added
- Flutter My Orders backed by the authenticated `GET /orders/me` API.
- Mobile order history cards with order status, payment status, items, totals, pull-to-refresh, and signed-out state.
- Flutter customer Address Book backed by the existing authenticated customer address APIs.
- Mobile address create, edit, delete, and make-default workflows with ownership enforced by the API.
- Auth-aware Riverpod repositories/providers for mobile order and address data.

### Changed
- The Flutter Profile address entry now opens the real address-management experience.
- The mobile Orders tab now reflects the signed-in customer's real account orders instead of a static placeholder.

## [0.17.1] - 2026-08-31

### Fixed
- Removed the unused Material import from the Flutter router.
- Wrapped auth error-message flow control in braces to satisfy the project lint rules.
- Fixed the remaining product-details flow-control lint so `flutter analyze` can return cleanly.

## [0.17.0] - 2026-08-31

### Added
- Flutter customer authentication foundation for Android and iOS.
- Mobile sign-in, registration, forgot-password request, session restore, resend-verification, and sign-out flows.
- Secure access/refresh token persistence through platform secure storage.
- Automatic Bearer authentication and single-flight refresh-token rotation in the mobile Dio client.
- Authenticated mobile profile state backed by the existing NestJS customer account APIs.
- Mobile API base URL configuration through `--dart-define=API_BASE_URL=...` for physical-device development.

### Changed
- Android Emulator API default now targets the host through `10.0.2.2:3001` instead of the storefront server.
- Mobile Profile now reflects the real signed-in customer instead of a static guest placeholder.

## [0.16.0] - 2026-08-31

### Added
- Customer profile editing for first and last name through authenticated API and storefront BFF routes.
- Persistent customer address book with create, edit, delete, and default-address workflows.
- Address ownership enforcement on every customer address mutation.
- Automatic default-address promotion when the current default address is removed.
- A ten-address account limit and Malaysian address validation for the current delivery market.
- Saved default-address prefill in authenticated checkout.

### Changed
- Account dashboard now separates personal details, address management, and order history.
- Customer data mutations continue through same-origin HttpOnly-cookie BFF routes rather than exposing access tokens to browser JavaScript.

## [0.15.0] - 2026-08-31
### Added
- Added secure email verification with single-use hashed verification tokens, expiry, resend support, and account verification state.
- Added enumeration-safe forgot-password and single-use password-reset flows with session revocation after a successful reset.
- Added provider-neutral account email delivery with development console delivery and SMTP support for production environments.
- Added storefront pages and same-origin API routes for email verification, resend verification, forgot password, and reset password.
- Added account verification status and resend controls to My Account.

### Security
- Account action tokens are generated from 48 cryptographically random bytes and only SHA-256 token hashes are persisted.
- Issuing a new token invalidates previous active tokens of the same type.
- Password reset responses do not reveal whether an email address exists.
- Successful password reset revokes all existing refresh sessions for the account.
- Production configuration rejects console email delivery and requires SMTP settings.
- Account token requests use a database-backed cooldown to reduce repeated email abuse without in-memory state.

## [0.14.3] - 2026-08-30
### Fixed
- Kept the Account action visible in the storefront header on narrow mobile viewports.
- Preserved the compact mobile header by hiding Wishlist first while retaining both Account and Cart access.

## [0.14.2] - 2026-08-30
### Fixed
- Made API `.env` discovery independent of the Nest build output layout and npm workspace working directory.
- The API now walks upward from both the runtime module directory and current working directory to locate the service root containing `prisma/schema.prisma`, then loads that service's `.env`.
- Preserved support for deployment environments that provide variables directly through the process environment.

## [0.14.1] - 2026-08-30
### Fixed
- Updated storefront mock product fixtures to satisfy the current Product domain contract.
- Added variant IDs, stock availability, and local product image metadata required by production type checking.

## [0.14.0] - 2026-08-30
### Added
- Added startup-time environment validation so missing or unsafe API configuration fails fast before NestJS begins serving requests.
- Added signed guest-order capability tokens backed by a dedicated ORDER_ACCESS_SECRET.
- Added HttpOnly storefront storage for recent guest-order access capabilities so guest order URLs do not need to expose tokens.
- Added same-origin payment proxy routes so customer JWT cookies and guest-order capabilities remain server-side.

### Changed
- Order status, payment creation, payment lookup, and development payment confirmation now require either authenticated order ownership or a valid guest-order capability.
- Checkout now issues a guest-order access capability only for guest orders; the storefront captures it into an HttpOnly cookie before returning the checkout result to browser JavaScript.
- Storefront payment requests now flow through the Next.js server boundary instead of calling the NestJS payment endpoints directly from the browser.
- API environment-file resolution now supports both workspace-root and services/api working directories.

### Security
- MANUAL_TEST payment creation and confirmation are blocked when NODE_ENV=production, with enforcement at both orchestration and provider layers.
- Production startup rejects MANUAL_TEST as the configured payment provider and requires Stripe credentials when STRIPE is selected.
- AUTH_JWT_SECRET and ORDER_ACCESS_SECRET must each contain at least 32 characters and must not reuse the same value.
- Unauthorized order access returns the same not-found response shape used for unknown orders to reduce order-enumeration leakage.

## [0.13.0] - 2026-08-30
### Added
- Added first-class customer accounts with secure email/password registration and login.
- Added short-lived JWT access tokens and database-backed refresh sessions with hashed refresh tokens.
- Added authenticated customer profile and My Orders endpoints.
- Added storefront sign-in, registration, account overview, sign-out, and order history experiences.
- Added a Next.js authentication boundary that keeps refresh tokens in HttpOnly cookies instead of browser localStorage.
- Added authenticated checkout ownership while preserving guest checkout.

### Changed
- Orders can now optionally belong to a customer account without breaking existing guest orders.
- Checkout associates new orders with the signed-in customer through optional backend authentication.
- Storefront checkout requests now pass through a same-origin server route so account credentials are never exposed to client JavaScript.
- The storefront Account navigation now opens the real customer account area.

### Security
- Passwords are stored only as bcrypt hashes.
- Refresh tokens are stored only as SHA-256 hashes in PostgreSQL and can be revoked on logout.
- Account order history is queried by authenticated user ID rather than by customer-supplied email addresses.

## [0.12.1] - 2026-08-30
### Fixed
- Fixed PaymentProviderRegistry Map inference so MANUAL_TEST and STRIPE adapters share the PaymentProviderAdapter interface correctly.
- Added Express TypeScript declarations required by the Stripe raw-body webhook controller.

## [0.12.0] - 2026-08-30
### Added
- Added a provider adapter contract for payment gateways instead of coupling payment orchestration to one vendor.
- Added a Stripe Checkout adapter that can create hosted payment sessions when Stripe credentials are configured.
- Added a Stripe webhook endpoint with signature verification before accepting provider events.
- Added provider-neutral handling for successful, failed, and expired external payments.
- Added payment-session redirect support to the storefront while preserving MANUAL_TEST for local development.
- Added payment provider configuration through environment variables.

### Changed
- Payment creation now routes through a provider registry and returns a provider checkout URL when applicable.
- Successful external payment events reuse the same inventory-commit and order-confirmation path as development payments.
- Failed or expired provider events update Payment and PaymentAttempt state without trusting browser callbacks.
- The storefront payment page now supports either hosted-provider redirect or local development confirmation.

## [0.11.0] - 2026-08-30
### Added
- Added a scheduled unpaid-order expiration worker using NestJS Schedule.
- Added automatic release of reserved inventory when a checkout reservation expires.
- Added a public non-sensitive order lifecycle endpoint and storefront order status page.
- Added status views for awaiting payment, confirmed, failed, cancelled, fulfilled, and expired orders.
- Added direct order-status navigation from checkout and payment completion.

### Changed
- Expired unpaid orders now transition to EXPIRED and pending payment records transition to FAILED.
- Inventory reservation cleanup is idempotent and runs inside serializable database transactions.
- Abandoned checkout sessions no longer leave stock reserved indefinitely.

## [0.10.0] - 2026-08-30
### Added
- Added provider-neutral Payment and PaymentAttempt persistence linked to orders.
- Added payment provider abstraction points for future Stripe, ToyyibPay, SenangPay, or other gateway adapters.
- Added a development-safe MANUAL_TEST provider that creates payment attempts without collecting card or bank credentials.
- Added payment creation, lookup, and development confirmation endpoints.
- Added an order payment page showing trusted server totals and payment lifecycle state.
- Added successful payment handling that confirms the order and converts reserved inventory into sold inventory.

### Changed
- Payment confirmation is now responsible for moving an order from AWAITING_PAYMENT to CONFIRMED.
- Inventory reserved during checkout is decremented from both physical quantity and reserved quantity only after successful payment.
- Payment writes use database transactions and idempotent state checks to prevent duplicate stock deductions.

## [0.9.0] - 2026-08-30
### Added
- Added Order and OrderItem persistence with immutable product, SKU, quantity, and price snapshots.
- Added order, payment, and shipping status enums for a durable checkout lifecycle.
- Added a checkout API with validated contact and Malaysian shipping-address input.
- Added server-side checkout repricing, inventory revalidation, shipping calculation, and stock reservation inside a serializable database transaction.
- Added idempotent cart-to-order conversion by enforcing one order per cart.
- Added a professional storefront checkout page for contact details, shipping address, delivery method, order review, and order confirmation.
- Added checkout response models and a dedicated client API boundary.
- Added cart-session reset after successful conversion so the next shopping session starts with a fresh cart.

### Changed
- Cart checkout now moves from a disabled placeholder to a real `/checkout` flow.
- Checkout totals are calculated exclusively from current backend product variants rather than trusting browser-submitted prices.
- Successful checkout marks the source cart as converted and reserves inventory quantities.
- Enabled global NestJS request validation with transformed DTO input.

## [0.8.1] - 2026-08-30
### Fixed
- Restored the complete Phase 009 storefront stylesheet after Phase 010 accidentally replaced `globals.css` with only the new product-media rules.
- Kept the new ProductImage gallery and product-card image styling while restoring all commercial storefront, responsive, product-detail, cart, header, and footer styles.

## [0.8.0] - 2026-08-30
### Added
- Added a first-class ProductImage database model with image URL, alt text, sort order, and primary-image state.
- Added product image relations and indexes for future admin upload and media management.
- Added local development product media assets so the storefront does not depend on external image hosts.
- Added ordered multi-image product gallery rendering with accessible alt text.
- Added graceful storefront fallbacks for products without media.

### Changed
- Product APIs now include ordered image data together with category, variants, and inventory.
- Storefront catalog mapping now preserves backend product images.
- Homepage product cards now display the primary product image.
- Product detail pages now display a main image and thumbnail gallery.
- Prisma seed now creates and updates product media records idempotently.

## [0.7.0] - 2026-08-30
### Changed
- Rebuilt the public storefront visual system to look and behave like a production retail ecommerce website rather than a development demo.
- Reworked the global header into a commercial ecommerce pattern with announcement bar, brand/search/actions row, and category navigation.
- Rebuilt the homepage with marketplace-style hero merchandising, trust/service strip, category discovery, featured products, promotional modules, and richer retail content hierarchy.
- Redesigned product cards with commercial price hierarchy, stock/featured labels, rating presentation, wishlist affordance, and clearer purchase entry points.
- Redesigned product detail pages around a professional two-column retail layout with media gallery framing, pricing, rating, delivery messaging, quantity controls, cart action, buy-now affordance, and service guarantees.
- Redesigned the cart page into a modern commerce basket with polished item rows, quantity controls, summary card, checkout hierarchy, and trust messaging.
- Replaced the previous lightweight demo footer with a multi-column ecommerce footer and customer reassurance content.
- Expanded responsive behavior for desktop, tablet, and mobile layouts while keeping the existing Next.js → NestJS → Prisma → PostgreSQL data flow intact.

## [0.6.0] - 2026-08-30
### Added
- Added a persistent anonymous browser cart session backed by localStorage.
- Added a client-side cart API boundary for reading, adding, updating, and removing cart items.
- Added a live cart page with quantities, line totals, subtotal, stock limits, remove actions, loading states, and empty state.
- Added a reusable AddToCartButton connected to the NestJS cart API.
- Added backend cart quantity update and item removal endpoints.

### Changed
- Product storefront models now retain the selected backend variant ID required for trusted cart operations.
- Product detail Add to Cart now writes to PostgreSQL through the NestJS API.
- Cart mutations revalidate current inventory and keep pricing sourced from backend product variants.
- Corrected the official changelog sequence while preserving earlier project history.

## [0.5.0] - 2026-08-30
### Added
- Added an idempotent Prisma development seed for categories, products, variants, and inventory.
- Added a typed storefront catalog API client and API-to-domain mapping.

### Changed
- Replaced Next.js mock catalog data with live NestJS/PostgreSQL product data.
- Replaced product detail mock lookup with live API-backed product loading.

## [0.4.1] - 2026-08-30
### Fixed
- Added NestJS runtime environment loading through ConfigModule.
- Updated PrismaService to consume DATABASE_URL through ConfigService.
- Restored a visible backend health/root endpoint and port 3001 startup configuration.

## [0.4.0] - 2026-08-30
### Added
- Added Category, Product, ProductVariant, Inventory, Cart, and CartItem commerce models.
- Added PrismaModule and PrismaService infrastructure for Prisma 7 PostgreSQL.
- Added database-backed Products, Categories, and Cart modules.

## [0.3.0] - 2026-08-30
### Changed
- Migrated the API Prisma configuration to the Prisma 7 datasource model.
- Removed `DATABASE_URL` from `prisma/schema.prisma` and moved connection configuration to `services/api/prisma.config.ts`.
- Aligned `prisma` and `@prisma/client` package ranges to Prisma 7.10.0.

### Added
- Added a Prisma 7 configuration file with explicit schema, migrations, and datasource settings.
- Refreshed the API environment example for the local TextShop PostgreSQL database.

## [0.2.0] - 2026-08-30
### Changed
- Repositioned Flutter as the Android/iOS customer application instead of the primary web storefront.
- Introduced a Next.js App Router storefront for the public ecommerce website.
- Converted the repository into a professional multi-client workspace.

### Added
- Added `apps/storefront` with responsive homepage, product cards, product detail routes, metadata and cart route boundary.
- Added `apps/mobile` preserving the existing Flutter feature-first application foundation.
- Added `services/api` with NestJS health/catalog modules and a Prisma/PostgreSQL boundary.
- Added root npm workspace scripts for storefront and API development/builds.
- Added architecture documentation defining trusted server responsibilities.

## [0.1.0] - 2026-08-30
### Added
- Established professional feature-first Flutter project structure.
- Added Riverpod dependency injection and async product state.
- Added GoRouter navigation with persistent bottom navigation shell.
- Added Dio API client boundary with environment-configurable API base URL.
- Added responsive storefront home page and mock product repository.
- Added product details, cart, orders, and profile foundations.
- Added initial widget test and project documentation.
