## 0.51.44 - Phase 054.31.16: Web Wishlist + Updates professional polish

- Refined Wishlist with a TextShop black/lime page header, cleaner saved-product presentation, and more polished signed-out, loading, and empty states.
- Kept the existing ProductCard, wishlist synchronization, refresh, authentication, and product navigation behavior unchanged.
- Reworked Updates / Notifications with a branded header, cleaner unread treatment, restrained `NEW` state, improved action hierarchy, and a more intentional empty state.
- Updated the notification bell unread badge to the established TextShop fluorescent-lime (`#DBFF4B`) accent.
- Preserved notification loading, mark-read, mark-all-read, action links, authentication, and API behavior.
- Added responsive adjustments for tablet and mobile without changing business logic.

## 0.51.43 - Phase 054.31.15: Web Orders / Purchases professional polish

- Refined the customer Purchases page with a TextShop black/lime header, cleaner search and status filters, and more structured order cards.
- Improved product rows, delivery/order totals, payment/status pills, refresh, empty, loading, and error states without changing order data or refresh behavior.
- Reworked Order Details into a clearer lifecycle layout with a stronger order identity block, more readable timeline, consistent totals, delivery, refund, return, and shipping panels.
- Kept order-detail content in normal document flow with no sticky sidebar behavior.
- Preserved payment recovery, cancellation, refund, return, fulfillment tracking, account order loading, product links, and all API/business logic.

## 0.51.42 - Phase 054.31.14: Web Checkout professional polish

- Refined the Checkout page into the established TextShop off-white, black, and fluorescent-lime visual system without changing checkout business logic.
- Added a stronger secure-checkout header, clearer numbered checkout sections, more polished form fields, and improved focus states.
- Refined saved-address and delivery-method selection so selected states use controlled black/lime emphasis instead of excessive green decoration.
- Reworked the order-review card, product rows, coupon controls, totals hierarchy, checkout CTA, and trust messaging for a more production-grade commerce presentation.
- Kept the order-review card in normal document flow rather than sticky scrolling.
- Improved responsive behavior for tablet and mobile layouts.
- No cart validation, inventory refresh, promotion/coupon selection, order creation, payment routing, address data, or API behavior changed.

## 0.51.41 - Phase 054.31.13: Web Cart professional redesign

- Rebuilt the Cart page presentation into a production-style commerce layout while preserving existing cart data flow, quantity updates, item removal, stock validation, checkout eligibility, and API behavior.
- Added a black/lime delivery-benefit banner with real progress toward the RM150 free-delivery threshold.
- Redesigned cart item cards with stronger product hierarchy, cleaner stock states, improved quantity controls, clearer line pricing, and a compact remove action.
- Reworked Order Summary into a calmer premium card with subtotal, delivery, estimated total, checkout CTA, issue messaging, and supporting checkout assurances.
- Improved signed-out, loading, error, and empty-cart states to match the established TextShop visual system.
- Added responsive tablet/mobile layouts without changing routing or business logic.

## 0.51.40.3 - Phase 054.31.12.3: Product info card full-height alignment

- Extended the desktop Product Details information card to match the height of the media-gallery column.
- Removed the awkward empty lower-right area while keeping both columns in normal scroll flow.
- Tablet and mobile layouts continue using natural content height.
- No product, variant, cart, wishlist, inventory, review, API, or routing behavior changed.

## 0.51.40.2 - Phase 054.31.12.2: Product info panel scroll behavior correction

- Removed the sticky positioning from the Product Details information card.
- The left media gallery and right product information now scroll together in normal document flow.
- Preserved all Product Details layout, variant, cart, wishlist, inventory, review, and API behavior.

## 0.51.40.1 - Phase 054.31.12.1: Product gallery width regression fix

- Fixed the Product Details media gallery being compressed by the legacy `grid-template-columns: 1fr 88px` gallery layout.
- The main product image now uses the full gallery width, with thumbnails displayed underneath as intended by Phase 054.31.12.
- No product media selection, variant, wishlist, cart, inventory, review, API, or routing logic changed.

## 0.51.40 - Phase 054.31.12: Web Product Details professional polish

- Refined Product Details into a clearer desktop commerce layout while preserving product, variant, stock, cart, wishlist, image-gallery, and review behavior.
- Upgraded the media gallery with a calmer product stage, compact thumbnails, and a single black/lime selected-image treatment.
- Rebalanced the product information panel with stronger title/price hierarchy, category context, product-detail/review shortcuts, clearer variant controls, and a more structured purchase area.
- Consolidated delivery and assurance information into quieter supporting surfaces instead of competing with the primary purchase action.
- Restyled Product details and Customer reviews as consistent full-width content modules using the established TextShop light canvas, black primary, and `#DBFF4B` accent system.
- Added responsive behavior for tablet/mobile without changing commerce APIs or business logic.

## 0.51.39.3 - Phase 054.31.11.3: Default address visual cleanup

- Removed the fluorescent-lime left-edge treatment from the default saved-address card.
- Kept the `Default` badge as the single black/lime visual indicator for the default address.
- Preserved address content, Edit/Remove actions, form behavior, and all account logic.

## 0.51.39.2 - Phase 054.31.11.2: Account page final layout correction

- Removed the duplicated Purchases, Wishlist, Addresses, and Updates shortcut cards from My Account because the global storefront header already provides those destinations.
- Removed the entire Recent orders / View all orders module from My Account; order history remains available through the header Purchases entry.
- Changed Personal details and Saved addresses from a side-by-side split into separate full-width rows, with Saved addresses directly below Personal details.
- Preserved the existing internal Personal details form and Saved addresses card layouts.
- Corrected the verification surface to the established TextShop fluorescent-lime (`#DBFF4B`) family.
- No account, address, authentication, order, API, or routing behavior changed.

## 0.51.39 - Phase 054.31.11: Web account dashboard redesign

- Reworked My Account into a clear customer dashboard while preserving all existing profile, verification, address, order, staff-role, and sign-out behavior.
- Added a compact black/lime identity hero and account shortcuts for Purchases, Wishlist, Addresses, and Updates.
- Reduced the visual weight of email verification and rebalanced the desktop profile/address layout.
- Changed Add address from a permanently expanded form into an explicit action that expands only when adding or editing an address.
- Preserved destructive action semantics and the established TextShop light/black/lime visual system.

## 0.51.38.2 - Phase 054.31.10.2: AliCDN order image support

- Added `img.alicdn.com` to the Next.js remote image allowlist.
- Fixes `next/image` runtime crashes on Account Orders when an order item snapshot uses an AliCDN product image.
- Preserved the existing Bing image host and all order, catalog, checkout, and image rendering behavior.

## 0.51.38.1 - Phase 054.31.10.1: Header category navigation fix

- Fixed the storefront category navigation where every category previously linked to the same unfiltered `/#shop` anchor.
- Women, Men, Home, Lifestyle, Accessories, and Sale now pass their category into the existing homepage catalog filter and jump directly to the catalog.
- New arrivals continues to open the default newest-sorted catalog.
- No catalog API, product data, search, cart, checkout, or visual layout behavior changed.

## 0.51.38 - Phase 054.31.10: Homepage category duplication cleanup

- Removed the oversized `Shop by category` card section because category discovery is already available in the storefront navigation.
- Changed the secondary hero action from the now-duplicated category anchor to the primary product catalog.
- Tightened the vertical transition into the catalog so products appear earlier on the homepage.
- Preserved the existing hero, catalog controls, product data, routing, and TextShop black/lime visual system.

## 0.51.37.1 - Phase 054.31.9.1: Revert homepage redesign

- Reverted the Phase 054.31.9 homepage layout redesign after visual review.
- Restored the storefront homepage structure from the user's current pre-redesign source.
- Kept the Phase 054.31.8 TextShop black/lime visual consistency layer intact.
- No commerce, API, routing, catalog, cart, checkout, order, payment, account, or staff behavior changed.

## 0.51.38 - Phase 054.31.9: Professional web home redesign

- Rebuilt the storefront home page into a clearer editorial commerce layout instead of stacking generic promo and card sections.
- Introduced a high-impact black/lime hero, compact service rail, asymmetric category discovery grid, cleaner catalog introduction, editorial brand story blocks, and a simplified trust/principles section.
- Preserved the existing live catalog search, category, price, stock, and sorting controls plus the existing ProductCard data flow.
- Kept the TextShop light-canvas + black + `#DBFF4B` brand system and added responsive layouts for desktop, tablet, and mobile.
- No API, catalog data contract, cart, checkout, payment, order, authentication, or staff business logic was changed.

## 0.51.37 - Phase 054.31.8: Storefront black/lime visual consistency

- Unified the Next.js storefront with the established TextShop light-canvas, black-primary, fluorescent-lime (`#DBFF4B`) visual system used by the mobile app.
- Reworked global brand surfaces including header, search, hero, promotional cards, category/product surfaces, campaigns, focus states, and footer without changing commerce behavior.
- Unified Staff Web console and Returns visual tokens from the previous blue-gray treatment to TextShop black/lime while preserving semantic success, error, reject, and destructive colors.
- Kept the website desktop-responsive layout intact; no API, cart, checkout, payment, order, catalog, or staff business logic was changed.

## 0.51.36.1 - Phase 054.31.7: Staff Center live auto-refresh

- Added a guarded 5-second live refresh loop to Staff Center commerce summary data.
- Refreshes immediately again when the app/browser resumes.
- Reuses the same refresh path for pull-to-refresh and the toolbar refresh action.
- Prevents overlapping summary requests while preserving the existing Staff Center UI and business logic.

## 0.51.31.6 - Phase 054.31.6: Staff Center Workspace UI Polish

### Changed
- Reworked the Flutter Staff Center from a long stack of similar cards into a structured operations dashboard while preserving the established TextShop off-white, black and fluorescent-lime visual language.
- Added a compact black Staff Commerce hero with live order, fulfillment, return and low-stock highlights.
- Grouped Orders & fulfillment, Returns operations, and Catalog & inventory into a dedicated workspace section with action-aware lime badges instead of mixing navigation and metrics together.
- Replaced the seven full-width summary rows with a responsive two-column mobile / four-column wide commerce-health grid, highlighting operational metrics only when they need attention.
- Added a concise operational-attention panel and removed the obsolete Staff Center information copy that said fulfillment actions remained web-only.

### Preserved
- Existing Staff Center summary provider, pull-to-refresh, manual refresh, Staff routes, Orders, Returns, Catalog, inventory, product editing, authentication, API contracts, and business logic remain unchanged.
- No customer-facing UI, backend, Prisma schema, database, or navigation contract changes are included.

## 0.51.31.5 - Phase 054.31.5: Staff Black/Lime UI Consistency Pass

### Changed
- Added a Staff-only visual theme that preserves the TextShop light/off-white canvas while standardising operational surfaces around black primary actions and fluorescent-lime accents.
- Unified Staff Center, Orders, Returns, Catalog & inventory, and Product Editor primary actions, inputs, app bars, dividers, and chip styling.
- Standardised Staff product-media `Upload image` and `Add by URL` actions as matching black buttons with white icon/text.
- Preserved destructive semantics: return rejection and product/SKU removal remain visually destructive instead of being recolored as ordinary brand actions.

### Preserved
- No Staff API, repository, domain model, route, authentication, inventory, fulfillment, returns, catalog, product-media, or upload behavior is changed.
- Customer-facing Home, Cart, Orders, Profile, Product Details, bottom navigation, and established TextShop visual language remain unchanged.

## 0.51.34.1 - Phase 054.31.4.1: Staff media action button consistency

### Changed
- Unified the Flutter Staff product-media `Upload image` and `Add by URL` actions with the same dark filled button treatment and white icon/text.
- Presentation-only adjustment; device upload, URL media creation, product synchronization, API behavior, and customer UI remain unchanged.

## 0.51.34 - Phase 054.31.4: Flutter Staff device image upload

### Added
- Added direct device image selection to the Flutter Staff product editor using `file_picker`.
- Staff can now choose JPG, PNG, or WebP images from Android, iOS, Web/Edge, or desktop file pickers and upload them through the existing protected product-media upload API.
- Added client-side 5 MB validation, MIME mapping, alt text, shared/SKU assignment, and optional primary-image selection before upload.
- Device upload is now the primary media action; URL-based media creation remains available as an optional fallback for existing workflows.

### Synchronization
- Successful uploads reload the authoritative Staff product and invalidate customer catalog/product-detail providers, preserving the Phase 054.31.3 media synchronization behavior.
- Existing primary-image, edit, remove, sort-order, and variant-media management remain unchanged.

### Scope
- Reuses the existing protected `POST /staff/catalog/products/:productId/images/upload` backend endpoint; no API, Prisma schema, database, storage-adapter, or customer UI change is included.
- `pubspec.yaml` adds `file_picker`; run `flutter pub get` after applying this increment.

## 0.51.31.3 - Phase 054.31.3: Product media synchronization fix

### Fixed
- Product details now preserves the backend's authoritative product-media ordering, so a Staff-selected primary image stays first even when shared and SKU-specific images are mixed.
- Product details automatically refreshes its product snapshot when the app/browser tab resumes, so Staff image changes and removals no longer require a manual customer-page refresh.
- The family product-details provider now auto-disposes after its page is no longer watched, preventing old product media snapshots from lingering across later visits.
- Flutter Staff product reloads now invalidate the customer catalog and matching product-details cache after product/media mutations.

### Preserved
- Existing product image storage, Staff media CRUD endpoints, variant media assignment, cart, wishlist, pricing, inventory, checkout, and TextShop visual language remain unchanged.
- No Prisma schema or database migration is included.

## 0.51.31.2.3 - Phase 054.31.2.3: Four-column mobile catalog density

### Changed
- Home product discovery now uses four columns at phone and compact-window widths, five columns on wider tablet/desktop widths, and six columns on large layouts.
- Reduced product-card controls, typography, padding, and fallback icon sizing so four-column cards remain readable without changing product, wishlist, inventory, search, filter, pagination, or navigation behavior.
- Kept the established TextShop light canvas, dark primary treatment, and fluorescent-lime accent unchanged.

### Preserved
- No API, domain model, catalog query, inventory, wishlist, authentication, checkout, order, or database behavior changes.
- Bottom navigation and existing Home interactions remain unchanged.

## 0.51.31.2.2 - Phase 054.31.2.2: Home true compact card density

### Changed
- Reworked the Home product-grid density more aggressively after the previous correction still rendered oversized cards on narrow/mobile logical widths.
- Two-column cards now use a landscape-leaning 1.12 aspect ratio instead of a tall portrait ratio, substantially reducing card height while keeping image, category, title, price, stock and wishlist actions visible.
- Medium logical widths switch to three columns from 560px, with tighter 8px grid gaps so web/device previews do not remain on oversized two-column cards.
- Reduced wishlist control, stock badge, card-content typography/padding and hero height to match the denser catalog presentation.

### Preserved
- Existing search, filters, sorting, pagination, wishlist, inventory, product navigation, refresh behavior, API contracts, commerce logic and bottom navigation remain unchanged.
- Existing TextShop off-white / black / fluorescent-lime visual language is preserved; this increment changes density only.

## 0.51.31.2.1 - Phase 054.31.2.1: Home compact-density correction

### Changed
- Reduced the narrow-screen product-card height again so two-column phone cards occupy substantially less vertical space.
- Lowered the responsive three-column breakpoint to 680px so medium-width mobile/web previews no longer render oversized two-column cards.
- Tightened product-card badge, content, title, price, grid-gap, and Home hero sizing without changing the established TextShop visual language.

### Preserved
- Existing search, filters, sorting, pagination, wishlist, inventory, product navigation, refresh behavior, API contracts, and bottom navigation remain unchanged.
- This is a presentation-density correction only; no commerce or backend behavior is changed.

## 0.51.31.2 - Phase 054.31.2: Home density polish

### Changed
- Reduced Home product-card height and tightened grid spacing so more catalog content is visible per screen without changing the two-column mobile layout.
- Reduced product-card image dominance and compacted category, title, price, stock badge, and wishlist spacing while preserving the existing card structure and interactions.
- Tightened Home hero, search, category, and section spacing to improve mobile information density while preserving the established TextShop light / black / fluorescent-lime visual language.

### Preserved
- Existing search debounce, server-backed filters, sorting, pagination/infinite loading, wishlist behavior, live inventory presentation, product navigation, refresh behavior, and bottom navigation are unchanged.
- No API, domain model, provider, database, checkout, order, authentication, or Staff behavior changes are included.

## 0.51.34.1 - Phase 054.31.1: Bottom navigation branch reset fix

### Fixed
- Bottom-navigation destinations now always reopen at their branch root instead of restoring a previously pushed child screen.
- Returning to Profile after opening Wishlist, Addresses, Updates, Staff Center, or another nested screen now shows the Profile root instead of a stale child page.
- The same predictable reset applies when switching back to Home, Cart, or Orders, preventing product/order-detail screens from unexpectedly reappearing after changing tabs.

### Preserved
- Existing routes, authentication guards, customer commerce behavior, Staff/Admin access rules, and TextShop visual styling are unchanged.
- No API, Prisma schema, database, or page UI changes are included.

## 0.51.34 - Phase 054.31: Profile UI Polish

### Improved
- Refined the Flutter Profile page into a stronger TextShop account hub while preserving the established light/off-white, black, and fluorescent-lime visual language.
- Added a branded signed-in identity panel with account verification and Staff/Admin role visibility.
- Added compact shortcuts for Orders, Wishlist, Addresses, and Updates without changing their existing routes or ownership rules.
- Elevated the existing Staff Center entry for Staff/Admin accounts while preserving backend-authoritative role protection.
- Reorganized account activity and sign-out presentation for clearer visual hierarchy.
- Refined the signed-out Profile state with clearer sign-in and registration guidance.

### Preserved
- Existing authentication/session behavior, email verification resend, logout invalidation, Staff/Admin access rules, account routes, bottom navigation, commerce APIs, and database behavior are unchanged.
- No global theme replacement or full-dark redesign is introduced.

## 0.51.31 - Phase 054.28: TextShop V1 Final Gate

### Status
- Declared the current commerce baseline `TextShop V1 Stable Baseline`.
- This milestone is a stable first-version baseline, not a Production Ready declaration.

### Final gate
- Product discovery and product-details purchase flow: PASS.
- Variant selection, live inventory visibility, cart validation, and cart mutation recovery: PASS.
- Guest authentication guidance and protected-flow return navigation: PASS.
- Checkout validation, coupon revalidation, server-authoritative pricing, and inventory reservation: PASS.
- Final-unit inventory, reserved-stock exhaustion, duplicate checkout, and inactive product/SKU regression coverage: PASS.
- Payment creation/recovery, provider failure handling, duplicate confirmation idempotency, and reservation-expiry protection: PASS.
- Customer orders, payment recovery, cancellation, fulfillment status, courier/tracking, and live order refresh: PASS.
- Staff/Admin role isolation and protected Staff Center access: PASS.
- Staff order processing -> shipping -> delivery workflow: PASS.
- Staff returns review -> transit/receive -> inspection -> refund completion workflow: PASS.
- Customer return/refund ownership and quantity boundaries: PASS.
- Account/address and authenticated session recovery flows: PASS.
- Guest-order signed access and account-order ownership isolation: PASS.
- In-app notification persistence and external email/push failure isolation: PASS.
- Mobile Staff catalog, inventory adjustment/history, product/SKU management, variant matrix, and product-media metadata management: PASS.
- API regression matrix through Phase 054.27: PASS.
- Root verification reported by the project owner after Phase 054.27: PASS.

### V1 regression matrix
- Phase 054.23 covered Cart/Inventory, fulfillment transitions, and warehouse return transitions.
- Phase 054.24 covered Checkout/Reservation/Payment settlement and unpaid-order reservation release.
- Phase 054.25 covered authentication/session boundaries, Staff authorization, and order-access isolation.
- Phase 054.26 covered payment recovery/provider failures and guest-to-account cart merge boundaries.
- Phase 054.27 covered refund/return edge cases and notification delivery failure isolation.
- All reported verification blockers from these rounds were resolved; Phase 054.26.1 was a test-only TypeScript union narrowing correction.

### Preserved
- Existing TextShop customer UI and established visual language are unchanged.
- Existing backend-authoritative pricing, inventory, payment, order, fulfillment, return, refund, and permission rules remain unchanged.
- No production API, Prisma schema, Flutter behavior, storefront behavior, navigation, or database changes are included in this milestone package.

### Next milestone
- Future work proceeds from this baseline as post-V1 enhancement work.
- Production readiness remains a separate later milestone requiring deployment/operations hardening, CI/CD, observability, security review, backup/recovery, and broader end-to-end/load validation.

## 0.51.30 - Phase 054.27: V1 Stability Matrix - Final Round

### Added
- Added direct-refund edge tests for fulfilled-order return enforcement, duplicate refund rejection, missing provider references, asynchronous refund processing, and provider refund failure recording.
- Added customer return-request edge tests for authentication, order ownership, duplicate item lines, remaining returnable quantity, and active-return conflict protection.
- Added notification delivery failure-isolation coverage proving in-app notifications survive simultaneous email and push delivery failures.

### Final-round focus
- Refund provider outages must be recorded as FAILED and must not be silently swallowed.
- Fulfilled orders must use the return workflow rather than bypassing warehouse inspection with a direct refund.
- Return quantities cannot exceed the unreturned quantity from the original order.
- A customer cannot create overlapping active returns for the same order.
- Email/push infrastructure failures cannot roll back an already-created in-app notification.

### Scope
- Test-only V1 stability increment.
- No production API, Prisma, Flutter, storefront, navigation, or UI changes.
- Existing `tsx --test test/**/*.test.ts` verification automatically includes these tests.

### Preserved
- Phase 054.23 through 054.26.1 regression coverage remains unchanged.
- Existing TextShop customer UI, Staff Center, checkout, payment, fulfillment, tracking, returns, refunds, and notification behavior remain unchanged.

## 0.51.29.1 - Phase 054.26.1: Payment recovery test type narrowing fix

### Fixed
- Narrowed the union return type from `PaymentsService.create()` before asserting the `resumed` field in payment-recovery regression tests.
- Fixes the two TS2339 build errors reported by `nest build` while preserving the already-passing runtime test behavior.

### Scope
- Test-only correction.
- No production API, Prisma, Flutter, storefront, or UI changes.
- Phase 054.26 feature/stability progress is unchanged; this correction does not count as a new V1 feature phase.

## 0.51.29 - Phase 054.26: V1 Stability Matrix - Round 4

### Added
- Added payment-recovery regression tests for existing-session resume, provider processing locks, expired-session replacement, provider session creation failure, and production blocking of the MANUAL_TEST provider.
- Added account-cart merge regression tests for guest-to-account migration, sellable-stock capping, the V1 quantity ceiling, sold-out guest-line removal, and invalid cart-session rejection.
- Added payment-provider registry regression tests ensuring supported adapters resolve deterministically and unsupported providers fail explicitly.

### Failure-recovery focus
- Repeated payment requests must resume an existing open provider session rather than create duplicate payment records.
- Provider sessions still processing must block a replacement payment attempt.
- Expired provider sessions must be failed before a replacement is created.
- Provider outages during session creation must leave the new payment marked failed instead of silently pending.
- Guest cart migration after sign-in must never create quantities above current sellable inventory or above the V1 cart limit.

### Scope
- No production API, Prisma, Flutter, website, or UI code is changed.
- These zero-database tests join the existing API test command automatically.

### Preserved
- Phase 054.23 through 054.25 stability coverage remains unchanged.
- Existing checkout, reservation, payment, authentication, order ownership, fulfillment, returns, Staff Center, and TextShop visual language remain unchanged.

## 0.51.28 - Phase 054.25: V1 Stability Matrix - Round 3

### Added
- Added authentication-guard regression tests for missing/malformed bearer tokens, valid identity attachment, expired/invalid access tokens, and optional-auth anonymous behavior.
- Added Staff authorization tests proving CUSTOMER accounts are rejected while STAFF and ADMIN roles are accepted.
- Added refresh-session tests for unknown, revoked, expired, and disabled-account sessions plus successful refresh-token rotation.
- Added access-token tests for wrong token type, expired/invalid JWT verification, deleted/unavailable accounts, and authoritative identity restoration.
- Added order-access isolation tests for account ownership, anonymous denial, guest-order token issuance, cross-order token rejection, and tampered-token rejection.

### Security and stability focus
- Protected API routes must fail closed with 401 when authentication is absent or invalid.
- Staff routes must enforce role separation with 403 for authenticated customers.
- Refresh sessions must rotate instead of being reused and must stop working after revocation, expiration, or account disablement.
- Account-owned orders continue to hide unauthorized access behind `Order not found`.
- Guest-order access tokens remain scoped to exactly one guest order and cannot grant access to account-owned or different guest orders.

### Scope
- No production auth, order, controller, database, or Flutter code is changed in this increment.
- No UI changes.
- The new tests run through the existing `tsx --test test/**/*.test.ts` API verification command.

### Preserved
- Phase 054.23 and 054.24 stability tests remain unchanged.
- Existing guest browsing, authenticated commerce, Staff Center, fulfillment, payment, inventory, returns, and TextShop visual language remain unchanged.

## 0.51.27 - Phase 054.24: V1 Stability Matrix - Round 2

### Added
- Added checkout reservation regression tests for final-unit checkout, reserved-stock exhaustion, product/SKU deactivation, duplicate checkout idempotency, current-price snapshotting, and coupon invalidation before inventory reservation.
- Added payment settlement regression tests for reserved inventory consumption, duplicate payment-confirmation idempotency, expired reservations, and missing reserved inventory.
- Added unpaid-order expiration tests covering reservation release, defensive release when reserved stock is lower than the order quantity, and re-checking expiration state inside the transaction.

### Stability focus
- Checkout → reservation → payment → order inventory settlement is now covered by dedicated zero-database service tests.
- Duplicate converted-cart checkout must return the existing order instead of reserving stock twice.
- Duplicate successful payment confirmation must not decrement inventory twice.
- Expired unpaid orders must release reservations and fail pending payment state.
- Invalid/expired coupons must fail before inventory is reserved.

### Scope
- No customer or Staff UI changes.
- No production service/controller/DTO/Prisma changes are included in this increment.
- These tests join the existing `tsx --test test/**/*.test.ts` API verification flow.

### Preserved
- Phase 054.23 Cart/Inventory, Fulfillment, and Returns stability tests remain unchanged.
- Existing TextShop visual language and commerce behavior remain unchanged.

## 0.51.26 - Phase 054.23: V1 Stability Matrix - Round 1

### Added
- Added zero-database API regression coverage for cart sellable-stock boundaries, including reserved inventory, final-unit purchases, combined cart quantities, unavailable SKUs, and invalid quantity limits.
- Added fulfillment transition regression coverage for processing, shipping, delivery, idempotency, payment-state enforcement, and shipping-detail validation.
- Added returns warehouse transition regression coverage for approval, in-transit, receiving, complete-line inspection, and completion preconditions.

### Stability scope
- This first V1 matrix round targets high-risk commerce state boundaries without changing production business logic.
- Tests use the existing Node `tsx --test test/**/*.test.ts` runner and remain database-free, matching the current automated testing foundation.
- Existing notification/email/push tests remain unchanged.

### Preserved
- No API production source, Prisma schema, Flutter source, storefront source, database behavior, customer UI, Staff UI, navigation, or TextShop visual language is changed.
- Existing inventory reservation, fulfillment, refund, return, authentication, payment, and catalog rules remain backend-authoritative.

## 0.51.25 - Phase 054.22: Mobile Staff Variant Matrix & Product Media

### Added
- Added Flutter variant-matrix generation to the Staff product editor.
- Staff can define one or two structured option axes, SKU prefix, base/compare-at prices, currency, and initial stock for generated combinations.
- Added mobile product-media record management for image URL, alt text, SKU assignment, display order, primary-image selection, metadata editing, and removal.
- Product state reloads after matrix and media mutations so the editor always reflects authoritative API data.

### API compatibility
- Uses the supplied current variant-matrix and product-image Staff Catalog endpoints.
- Existing backend duplicate-combination handling, 100-combination limit, image/variant validation, and publishing rules remain authoritative.
- No backend, DTO, Prisma, or `products.service.ts` modification is included.

### Scope
- Device binary upload remains available in the existing web Staff Catalog.
- This mobile increment manages catalog media by URL and metadata without introducing a new Flutter file-picker dependency.

### Preserved
- Phase 054.20.1 immediate inventory decrease refresh remains preserved.
- Existing mobile product/SKU, inventory, returns, orders, customer UI, and TextShop visual language remain unchanged.

## 0.51.24 - Phase 054.21: Mobile Staff Product Management

### Added
- Added protected Flutter routes for creating and editing Staff catalog products.
- Added `New product` access from the mobile Catalog & inventory AppBar and `Edit product` access on each product card.
- Added product create/edit fields for name, slug, description, category, status, and featured state.
- New products are intentionally created as `DRAFT`, matching the backend publishing rule.
- Added mobile SKU creation and editing for SKU, variant name, selling price, compare-at price, currency, active state, initial quantity, and option values.
- Added safe SKU removal; the existing backend decides whether a SKU is physically deleted or deactivated when commerce/audit history exists.
- Added editor option loading from the current active category list and full product reload after mutations.
- Added backend error propagation, busy-state protection, validation, and refresh support.

### API compatibility
- Built against the supplied current Staff Catalog controller and DTOs.
- Uses existing protected endpoints for editor options, product create/read/save, variant create/save, and variant removal.
- Existing backend publishing validation remains authoritative: an active SKU is required before a product can be published.
- No change was made to `products.service.ts`, the Staff controller, DTOs, Prisma schema, or database.

### Scope
- This increment covers core product and SKU management in Flutter.
- Variant-matrix generation and product-media upload/management remain in the web Staff Catalog and are intentionally deferred to the next increment.

### Preserved
- Existing mobile inventory adjustment/history behavior, including Phase 054.20.1 immediate decrease refresh, remains preserved.
- Existing customer catalog UI and TextShop visual language remain unchanged.
- Existing Staff Orders and Returns operations remain unchanged.

## 0.51.23.1 - Phase 054.20.1: Inventory decrease refresh fix

### Fixed
- Staff Catalog now immediately applies the authoritative inventory returned by the adjustment API to the matching SKU after both positive and negative stock adjustments.
- Decreasing stock now updates Quantity, Reserved, and Available on screen immediately instead of depending solely on the follow-up catalog reload.
- The normal catalog reload still runs after the local authoritative update so filters and server state remain synchronized.

### Preserved
- Existing audited inventory adjustment API, validation, inventory history, catalog filters, customer catalog UI, and TextShop visual language remain unchanged.
- No backend or database change is included.

## 0.51.23 - Phase 054.20: Mobile Staff Catalog & Inventory

### Added
- Added protected Flutter `/staff/catalog` access for authenticated `STAFF` and `ADMIN` accounts.
- Added a Staff Center entry for native Catalog & inventory operations.
- Added staff catalog search by product, slug or SKU, product-status filtering, and the existing low-stock filter.
- Added product and SKU inventory visibility for physical quantity, reserved stock, and available stock.
- Added audited inventory adjustments with signed deltas and a required reason.
- Added client-side validation preventing zero adjustments and quantities below reserved stock; the backend remains authoritative.
- Added the latest 50 inventory-adjustment history records per SKU with actor, reason, quantity transition, and timestamp.
- Added refresh, pull-to-refresh, busy-state protection, and API error handling.

### API compatibility
- Built directly against the supplied current `StaffProductsController`, `ProductsService`, and staff catalog domain.
- Uses the existing protected `GET /staff/catalog`, `POST /staff/catalog/variants/:variantId/inventory/adjust`, and `GET /staff/catalog/variants/:variantId/inventory/history` endpoints.
- No changes were made to `products.service.ts`; all existing Staff product methods are preserved.

### Scope
- This increment intentionally focuses on catalog visibility and audited stock control.
- Product creation, full product editing, variant matrix editing, and media management remain in the existing web Staff Catalog for now.

### Preserved
- Existing customer catalog UI and commerce behavior remain unchanged.
- Existing Flutter Staff Orders and Returns operations remain unchanged.
- Existing web Staff Catalog remains available.
- No backend API or database change is included.

## 0.51.22 - Phase 054.19: Mobile Staff Returns operations

### Added
- Added protected Flutter `/staff/returns` operations for authenticated `STAFF` and `ADMIN` accounts.
- Added a Staff Center entry for returns management using the existing protected Staff Returns API.
- Added status filtering and native return-case cards with order, customer, item, reason, refund and inspection information.
- Added approve/reject review with optional staff notes.
- Added the operational return chain: approve → in transit / receive → inspect → complete & refund.
- Added per-item inspection inputs for condition (`UNOPENED`, `OPENED`, `DAMAGED`, `DEFECTIVE`) and disposition (`RESTOCK`, `QUARANTINE`, `DISCARD`).
- Added confirmation dialogs, operation busy-state protection, API error handling, manual refresh and pull-to-refresh.

### API compatibility
- Uses the existing Staff Returns endpoints already used by the web staff console:
  `GET /staff/returns`, plus `approve`, `reject`, `in-transit`, `receive`, `inspect`, and `complete` actions.
- Existing backend transition, refund and inventory-disposition logic remains authoritative; no duplicate business rules are introduced in Flutter.

### Preserved
- Existing customer returns, orders, Staff Orders & Fulfillment, Profile, navigation and TextShop visual language remain unchanged.
- Existing web Staff Returns console remains available.
- No backend API or database change is included in this phase.

## 0.51.21 - Phase 054.18: Mobile Staff Orders & Fulfillment

### Added
- Added protected Flutter `/staff/orders` operations for authenticated `STAFF` and `ADMIN` accounts.
- Added Staff Center navigation into native Orders & fulfillment.
- Added live staff order loading with status, payment-status and text search filters backed by the existing `GET /staff/orders` API.
- Added order cards with customer identity, totals, item summaries, processing/shipping/delivery timestamps and tracking details.
- Added native fulfillment actions for `Start processing`, `Ship order`, and `Mark delivered`.
- Added a validated shipping dialog requiring courier and tracking number with an optional HTTP/HTTPS tracking URL.
- Added confirmation dialogs, busy-state protection, API error handling, manual refresh and pull-to-refresh.

### Security and workflow
- The `/staff/orders` page uses the existing Staff/Admin route guard and the backend `StaffAuthGuard` remains authoritative.
- Existing backend transition rules are preserved: paid confirmed orders can enter processing, paid processing orders can ship, and shipped orders can be marked delivered.
- No email-based administrator checks are introduced.

### Preserved
- Existing customer commerce flows, bottom navigation and TextShop visual language remain unchanged.
- Existing web Staff Orders console remains available.
- No backend API or database changes are included in this phase.

## 0.51.20 - Phase 054.17: Protected mobile Staff Center foundation

### Added
- Added a Staff/Admin-only `/staff` route guarded by the authenticated user's backend role.
- Added a Staff Center entry to Profile for `STAFF` and `ADMIN` accounts only; customer Profile remains unchanged.
- Added a native Staff Center overview backed by the existing protected `GET /staff/orders/summary` API.
- Added operational counters for total orders, awaiting payment, ready to fulfill, fulfilled orders, active returns, refund processing, and low-stock variants.
- Added pull-to-refresh, manual refresh, loading, and retry states for the Staff Center summary.

### Security
- Unauthenticated access to `/staff` is redirected through the existing sign-in return flow.
- Authenticated customer accounts cannot open the Staff Center and are returned to Profile.
- Backend `StaffAuthGuard` remains the source of truth for API authorization; the Flutter route guard is an additional UX boundary, not a replacement for server authorization.

### Preserved
- Existing customer navigation, commerce flow, Profile content, and TextShop visual language remain unchanged.
- Existing web Staff Orders console remains the fulfillment surface in this phase.
- No backend API or database change is required.

## 0.51.19 - Phase 054.16: Admin / Staff identity recognition

### Added
- Flutter `AuthUser` now parses the backend `role` returned by login/register/session restore and `/auth/me`.
- Added typed `AuthUserRole` handling for `CUSTOMER`, `STAFF`, `ADMIN`, plus a safe unknown fallback.
- Added `hasStaffAccess`, `isStaff`, and `isAdmin` helpers so future Staff Center routing and authorization can use role semantics instead of email-based checks.
- Staff/Admin accounts now show a small role chip on Profile so the signed-in identity can be verified from the mobile client.

### Backend verification
- The current NestJS auth service already includes Prisma `UserRole` in its public authenticated-user response, and the existing staff guard accepts `STAFF` and `ADMIN`; no backend auth change was required for this phase.

### Preserved
- Customer account behavior and existing authentication/session flows remain unchanged.
- Existing TextShop layout, navigation, colors, and visual language remain unchanged; no redesign is included.
- This phase establishes role recognition only. It does not add a Flutter Staff Center or duplicate the existing web staff console.

## 0.51.18.3.1 - Phase 054.15.3.1: Orders refresh analyzer fix

### Fixed
- Consume the Riverpod `ref.refresh(...)` result while still awaiting the refreshed orders request, resolving the `unused_result` analyzer warning.
- No behavior, API, navigation, or UI changes.

## 0.51.18.3 - Phase 054.15.3: Reliable My Orders live refresh

### Fixed
- My Orders now uses `ref.refresh(customerOrdersProvider.future)` for each polling cycle so every cycle explicitly performs a fresh `/orders/me` read and publishes the returned order list.
- The order-list poll is no longer cancelled when Flutter Web becomes `inactive` or `paused` while switching to the Staff browser tab. This prevents the customer list from silently stopping while staff changes an order to processing, shipped, or delivered.
- Returning to the customer tab still triggers an immediate refresh in addition to the normal 4-second polling cycle.
- Polling is cancelled only when the app is detached/disposed; background browser throttling remains platform-controlled.

### Preserved
- Existing TextShop My Orders UI, card layout, status chip styling, navigation, and visual language remain unchanged.
- Existing Order Details live refresh and staff fulfillment rules remain unchanged.
- No websocket or backend API changes are introduced.

## 0.51.18.2 - Phase 054.15.2: Live order-list status refresh

### Fixed
- My Orders now refreshes from the server every 4 seconds while the page is visible and the customer is signed in.
- Staff fulfillment changes such as `CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED` now update directly on the order cards instead of only updating inside Order Details.
- The list refresh pauses when the app is backgrounded and resumes when the app returns to the foreground.
- Refresh requests are de-duplicated so overlapping poll/manual refresh operations do not run concurrently.
- Temporary network failures keep the last successful order list visible and retry on the next refresh interval.

### Preserved
- Existing TextShop My Orders card layout, colors, status chip styling, navigation, and visual language remain unchanged.
- Existing Order Details live fulfillment refresh from Phase 054.15.1 remains unchanged.
- No websocket or new backend infrastructure is introduced for the V1 baseline.

## 0.51.18.1 - Phase 054.15.1: Live fulfillment refresh

### Fixed
- Customer order details now poll the server every 4 seconds while an order is still active, so staff fulfillment changes appear stage-by-stage instead of only after the customer manually refreshes at the end.
- `CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED` changes now refresh both the open order and the My Orders list while the order-details page is visible.
- Live refresh pauses when the app is backgrounded and stops for terminal order states to avoid unnecessary requests.
- Temporary refresh/network failures keep the last successful order state visible and are retried on the next interval.

### Preserved
- Existing TextShop order-details UI and visual styling are unchanged.
- Existing manual refresh, pull-to-refresh, payment recovery, cancellation, refunds, returns, courier/tracking display, and staff fulfillment rules remain unchanged.
- No websocket or new backend infrastructure is introduced for the V1 baseline.

## 0.51.18 - Phase 054.15: Customer tracking closure

### Improved
- Customer order details now refresh both the selected order and the customer order list from the app-bar refresh action and pull-to-refresh.
- Processing time is now shown in the delivery section when staff has moved an order into processing.
- Shipping and delivery timestamps now include local time as well as the date.
- Tracking links are shown only for valid HTTP/HTTPS URLs and now fail gracefully if the external browser cannot be opened.
- Optional fulfillment metadata is trimmed and malformed fulfillment timestamps no longer crash order-details parsing.

### Preserved
- Existing TextShop order-details layout, colors, cards, typography, and customer visual language remain unchanged.
- Existing payment recovery, cancellation, refunds, returns, shipping address, timeline, notification, checkout, and inventory behavior remain unchanged.
- Staff fulfillment state transitions from Phase 054.14 remain backend-authoritative.

## 0.51.17.1 - Phase 054.14.1: Fix auth back navigation

### Fixed
- Auth screens now return to the public storefront when they were opened through a route replacement and there is no Navigator history to pop.
- Existing pushed auth flows such as Register and Forgot Password still pop back normally when a previous route exists.

### Preserved
- Guest `returnTo` login behavior from Phase 054.13 remains unchanged.
- No TextShop UI, colors, layout, authentication API, checkout, order, inventory, or staff fulfillment behavior is changed.

## 0.51.17 - Phase 054.14: Staff fulfillment hardening

### Improved
- Completed the existing staff fulfillment console around the current paid-order lifecycle: confirmed -> processing -> shipped -> delivered.
- Staff order list responses now include `processingAt` and `trackingUrl` alongside the existing courier, tracking number, shipped time, and delivered time.
- Staff order cards now surface processing, shipment, delivery, and tracking-link information already stored by the backend.
- Shipping submissions trim courier/tracking values and reject blank fulfillment details before calling the API.
- Staff order loading and fulfillment mutations now recover cleanly from network failures instead of leaving loading/busy state stuck.

### Preserved
- Existing backend transition rules remain authoritative: only paid confirmed orders can enter processing, only paid processing orders can ship, and only shipped orders can be marked delivered.
- Existing customer order, notification, refund, return, inventory, checkout, and payment behavior is unchanged.
- Existing TextShop staff visual design and layout are preserved.

## 0.51.15.1 - Phase 054.13.1: Fix guest auth router compile error

### Fixed
- Replaced the non-existent `AuthState.isChecking` getter usage in the mobile auth route guard with the existing `AuthStatus.checking` state.
- Added the `auth_state.dart` import required by the route guard.

### Stability
- Guest authentication routing and `returnTo` behavior from Phase 054.13 are preserved.
- No TextShop UI, theme, layout, backend API, checkout, order, inventory, or staff workflow behavior is changed.

## 0.51.16 - Phase 054.13: Guest authentication return flow

### Added
- Added a shared Flutter authentication route guard for account-bound destinations: cart, wishlist, checkout, orders, order details, addresses, notifications, and profile.
- Guest navigation to a protected destination now routes to Sign in with the original internal destination preserved in `returnTo`.
- Registration now preserves the same `returnTo` destination and returns there after successful account creation.

### Fixed
- Signing in from a protected flow now returns the customer to the destination they originally requested instead of always sending them to Profile.
- The Sign in -> Create account path now carries the protected destination through registration.
- Unsafe/authentication-loop return paths fall back to Profile.

### Stability
- Home and product browsing remain available to guests.
- Existing TextShop authentication styling, navigation shell, commerce pages, API contracts, inventory, checkout, payment, and order behavior are preserved.
- No visual redesign is introduced.

## 0.51.15 - Phase 054.12: Refresh inventory after checkout reservation

### Fixed
- Flutter now invalidates catalog, product-detail, and wishlist product snapshots immediately after an order is created and receives its 30-minute inventory reservation.
- Home/product stock no longer depends on a manual refresh to observe the server-authoritative available inventory after checkout.

### Stability
- The backend remains authoritative for inventory and reservation calculations; this change only refreshes stale Flutter client state after successful order creation.
- Existing checkout validation, coupon revalidation, payment recovery, cart invalidation, order invalidation, UI layout, theme, and navigation are preserved.
- No storefront UI, Staff UI, Prisma schema, inventory rules, payment rules, or order lifecycle API contract is changed.

## 0.51.14 - Phase 054.11: Safe storefront order images

### Fixed
- Added the storefront Next.js image configuration required by the current Bing-hosted product image URLs used by existing order snapshots.
- Order history now falls back to the existing TextShop placeholder when an allowed remote image fails to load instead of leaving a broken image state.
- Restored access to `/account/orders` for existing orders that contain the current `tse4.mm.bing.net` image host.

### Stability
- Existing order layout, actions, filters, status presentation, and visual styling are preserved.
- No Flutter UI, customer purchase flow, Staff UI, API contract, Prisma schema, inventory, payment, or order lifecycle behavior is changed.

## 0.51.13 - Phase 054.10: Independent wishlist product source

### Fixed
- Wishlist no longer derives saved products from the currently loaded paginated catalog page.
- Saved products are now loaded independently from the unfiltered active product catalog, so Home search, category, price, stock filters, sorting, and pagination do not hide valid wishlist items.
- Pull-to-refresh now refreshes both wishlist ids and the independent wishlist product data source.

### Stability
- Existing wishlist presentation, product cards, routes, optimistic save/remove behavior, and authentication guard are preserved.
- This first-version implementation intentionally reuses the existing unpaginated product endpoint instead of adding a new wishlist-products API contract.
- No Home UI, theme, catalog filter UI, product details, cart, checkout, orders, payment, Staff Catalog, Prisma, or API service behavior is changed.

## 0.51.12 - Phase 054.9: Stable account and address flows

### Improved
- Session restoration now safely falls back to the signed-out state when local storage or another non-HTTP restore step fails, preventing the app from remaining stuck in account checking.
- Login and registration avoid updating authentication state after their controller has been disposed.
- Sign out always transitions the local app to the signed-out state after local credentials are cleared, even when the remote logout request fails.
- Email-verification resend and password-reset requests now recover from non-HTTP failures without leaving account actions stuck.
- Signing out explicitly clears cached customer address state together with other account-scoped customer data.
- Address create/edit, default-address changes, and address deletion now re-sync the address book from the server after success.

### Stability
- Existing sign-in, registration, forgot-password, profile, verification, and address-book presentation is preserved.
- No authentication UI redesign, Home, theme, product details, cart, checkout, orders, payment, Staff Catalog, Prisma, or API behavior is changed.

## 0.51.11 - Phase 054.8: Stable customer order actions

### Improved
- Payment recovery now refreshes both the order details and the customer order list after a confirmed or development payment succeeds.
- Successful order cancellation, refund requests, and return requests now immediately re-sync both order views from the server.
- Prevents payment continuation and order cancellation from starting at the same time.
- Adds mounted-state checks after confirmation dialogs before starting order mutations.

### Stability
- Existing order timeline, shipping, fulfillment, refund, return, payment recovery, and reservation-expiry presentation remains unchanged.
- No Orders visual redesign, Home, theme, product details, cart, checkout, payment-provider contract, Staff Catalog, Prisma, or API behavior is changed.

## 0.51.10 - Phase 054.7: Stable checkout submission flow

### Improved
- Revalidates an applied coupon against the latest server cart session immediately before order creation.
- Prevents a coupon validated for an older cart snapshot from being carried into a new checkout session.
- Stops checkout safely and asks the customer to review updated totals when a coupon becomes invalid during submission.
- Re-syncs the server cart after checkout failures that occur before an order is created.
- Adds mounted-state guards around asynchronous checkout transitions to avoid updating a disposed page.

### Stability
- Existing server-authoritative inventory refresh, Serializable checkout validation, payment amount verification, order reservation, and payment recovery behavior remain intact.
- No Checkout visual redesign, Home, theme, product detail, cart UI, payment provider contract, Staff Catalog, Prisma, or API service behavior is changed.

## 0.51.9 - Phase 054.6: Stable cart mutation flow

### Improved
- Hardened cart quantity updates against inactive products, inactive variants, sold-out stock, and quantities above current available stock.
- Successful quantity changes and removals now immediately re-sync the cart from the server instead of relying only on a deferred invalidation.
- Failed cart mutations also re-sync server state so the UI does not remain stale when inventory or cart state changed concurrently.
- Added fallback handling for non-HTTP cart mutation failures.
- Keeps the existing cart presentation and checkout flow unchanged.

### Stability
- Cart item actions remain locked while their request is running to prevent duplicate mutations.
- Quantity is capped by both current available inventory and the existing first-version cart limit.
- No Home, theme, product-detail styling, checkout, payment, Staff Catalog, Prisma, or API behavior is changed.

## 0.51.8 - Phase 054.5: Stable product detail purchase flow

### Added
- Connected the existing product-details screen to real product and variant data without redesigning the app theme.
- Displays the selected variant price, compare-at price, SKU, live available stock, and sold-out state.
- Added variant selection with quantity controls constrained by available stock.
- Uses product/variant images with fallback handling and optional image thumbnails.
- Connected Add to cart to the existing cart repository and refreshes the shared cart state after a successful add.
- Added wishlist toggle support using the existing wishlist controller.
- Added signed-out guards plus API error feedback for cart and wishlist actions.

### Stability
- Add to cart is disabled for sold-out variants and while a request is already running.
- Quantity cannot exceed the selected variant's current available stock.
- Switching variants resets quantity and image selection to a safe state.
- No Home, catalog pagination, theme, checkout, payment, Staff Catalog, Prisma, or API service behavior is changed.

## 0.51.7.4 - Phase 054.4.4: Retire legacy root Flutter app

### Removed
- Retired the obsolete Flutter application that lived at the repository root.
- `apps/mobile` is now the only supported Flutter mobile application location.
- This cleanup removes duplicate root Flutter entrypoints/platform folders only and does not change the active mobile UI or commerce behavior.

### Project structure
- Run the mobile app from `apps/mobile`.
- The repository root remains the monorepo/workspace root for shared scripts, documentation, storefront, and API services.

## 0.51.7.3 - Phase 054.4.3: Revert unauthorized product-detail restyle

### Restored
- Reverted the Phase 054.4.2 product-details visual restyle and restored the exact prior presentation baseline.
- Kept only the lint-safe braces around the null-product guard.
- No Home, Hero, search, category, product-card, bottom-navigation, API, pagination, inventory, payment, Prisma, or Staff Catalog behavior is changed.

## 0.51.7.2 - Phase 054.4.2: Restore black-and-lime product details UI

### Restored
- Restored the Flutter product details page to the established TextShop black-and-fluorescent-lime visual identity.
- Removed the accidental slate/grey product-detail styling and aligned the page with the existing brand palette.
- Preserved the current product provider, product data, navigation contract, and placeholder Add to cart behavior; this increment is presentation-only.
- Kept the curly-braces lint fix for the null-product guard.

## 0.51.6.1 - Phase 054.4.1: Wishlist pagination compatibility

### Fixed
- Updated the Flutter wishlist page to read products from the paginated `ProductCatalogState.items` collection introduced in Phase 054.4.
- Preserved the existing wishlist refresh, authentication, product-card navigation, and empty/error states.
- This is a regression-recovery increment only; no API, inventory, payment, Prisma, or Staff Catalog behavior is changed.

## 0.51.7 - Phase 054.4: Catalog pagination and infinite scrolling

### Added
- Added optional `page` and `limit` parameters to the public product catalog API while preserving the legacy unpaginated array response for existing storefront callers.
- Added paginated catalog responses with `items`, `page`, `limit`, `total`, and `hasMore`.
- Added Flutter incremental catalog loading with a 24-product page size, duplicate-ID protection, and automatic next-page loading near the bottom of the list.

### Changed
- Flutter search, category, sort, price, and stock-filter changes now rebuild pagination from page 1 automatically.
- Pull-to-refresh resets the product catalog to page 1 while continuing to refresh catalog metadata and wishlist state.
- Product result counts now show loaded products against the server-reported filtered total.
- Preserved the verified Staff Catalog service surface and existing storefront behavior; no Prisma migration, payment flow, reservation policy, authentication behavior, or staff UI contract is changed.

## 0.51.6 - Phase 054.3: Catalog filter consistency hardening

### Changed
- Flutter name sorting now uses the backend `name` sort contract instead of downloading server results and re-sorting them on the client.
- Pull-to-refresh now refreshes lightweight catalog metadata together with products and wishlist state.
- The Flutter filter sheet now shows the active catalog price range from `GET /products/catalog-meta` when metadata is available.
- Preserved the verified Phase 054.2.1 Staff Catalog recovery baseline; no staff product, variant, image, inventory, payment, reservation, authentication, or Prisma behavior is changed.

## 0.51.5.1 - Phase 054.2.1: Staff catalog service recovery

### Fixed
- Restored the complete Staff Catalog service surface that was accidentally removed by the Phase 054.2 incremental package.
- Preserved the Phase 054.2 `catalogMetadata()` endpoint implementation while restoring staff product, variant, image, and inventory operations.
- This is a regression-recovery increment only; no new product behavior, Prisma migration, payment flow, inventory reservation policy, or UI change is introduced.

## 0.51.5 - Phase 054.2: Lightweight catalog metadata

### Added
- Added `GET /products/catalog-meta` for lightweight public catalog metadata.
- The metadata response exposes active product categories plus minimum and maximum active variant prices without returning product images, inventory payloads, descriptions, or full variant records.

### Changed
- Flutter category discovery now uses catalog metadata instead of downloading a second unfiltered copy of the complete product catalog.
- `ProductRepositoryCatalogMetadata` provides a fallback implementation for test doubles and non-API repositories, so existing repository abstractions remain backward compatible.
- Preserved Phase 054.1 server-backed search/category/sort/price/availability filters and the locked black/fluorescent-lime UI.
- No Prisma migration, payment behavior, reservation policy, or authentication change is required.

## 0.51.4 - Phase 054.1: Flutter server-backed catalog filters

### Added
- Added Flutter catalog controls for minimum price, maximum price, and in-stock-only discovery.
- Added an advanced filter badge so customers can see when price/availability constraints are active.

### Changed
- Flutter catalog search, category, sort, price, and availability filtering now flow through the existing `ProductCatalogQuery` API contract instead of filtering a fully downloaded catalog locally.
- Search input is debounced before server requests to avoid unnecessary API traffic while typing.
- Category discovery remains based on the unfiltered catalog so selecting a category does not collapse the available category list.
- Name sorting remains client-side because the current backend catalog sort contract supports newest and price ordering.
- Empty-state reset now clears search, category, sort, price range, and in-stock-only state together.
- Preserved the locked TextShop black/fluorescent-lime visual identity and existing wishlist/product navigation behavior.
- No API contract change, Prisma migration, inventory policy change, or payment behavior change is required.

## 0.51.3.1 - Phase 054.0.1: Storefront variant option mapping fix

### Fixed
- Restored `optionValues` when mapping API product variants into the storefront `ProductVariant` domain model.
- Fixed the Next.js production type-check failure introduced by the Phase 054.0 catalog mapping baseline.
- No API behavior, database schema, Flutter UI, or locked black/lime visual identity changes are included.

## [0.51.0] - 2026-09-02

### Added
- Phase 054.0 catalog discovery foundation with a shared backend query contract for price range and real available-stock filtering.
- Storefront catalog controls for minimum price, maximum price, and in-stock-only discovery while preserving URL-backed filters.
- Flutter product repository support for the same search/category/sort/price/availability query parameters for upcoming mobile filter UI.

### Changed
- Catalog availability filtering uses `quantity - reserved` so reserved inventory is not presented as sellable stock.
- Existing black/fluorescent-lime Flutter visual identity and commerce flows are unchanged.

## 0.51.3 - Phase 053.3: Checkout inventory recovery loop

### Changed
- Added an in-place stock refresh action to blocked Flutter and website checkout screens so customers can recover after inventory changes without losing entered delivery details.
- Refreshing stock now re-reads the account cart from the server and revalidates any applied coupon against the updated cart; automatic promotion state is recalculated from the refreshed subtotal.
- Customers are returned to a ready-to-checkout state automatically when the refreshed cart becomes valid, while unresolved variant availability issues still direct them to the cart for correction.
- Preserved account-only ownership, server-authoritative inventory validation, payment recovery behavior, the locked black-and-lime visual identity, and the 30-minute inventory reservation policy.
- No Prisma migration is required.

## 0.51.2 - Phase 053.2: Checkout inventory preflight

### Changed
- Flutter and website checkout now refresh the signed-in customer's cart immediately before creating an order, reducing stale-stock submissions after a customer spends time filling in delivery or coupon details.
- Checkout stops locally when the refreshed cart is empty or contains newly unavailable/out-of-stock variant lines and directs the customer to review the latest cart state.
- Preserved the backend as the final source of truth: checkout still validates live variant/product availability and sellable inventory inside the existing Serializable order transaction before reserving stock.
- Preserved account-only checkout ownership, promotion/coupon validation, payment recovery behavior, and the 30-minute inventory reservation policy.
- No Prisma migration is required.

## 0.51.1 - Phase 053.1: Cart variant & inventory hardening

### Changed
- Added one-tap quantity correction for cart lines whose requested quantity now exceeds live sellable stock on both Flutter and the website.
- Cart quantity controls now explicitly respect inactive products/variants and surface low-stock messaging when five or fewer units remain.
- Failed quantity updates now refresh live cart inventory so customers immediately see server-authoritative stock changes instead of a stale cart snapshot.
- Preserved account-only cart ownership, variant-specific SKU/media display, checkout blocking for invalid lines, server-side stock validation, and the 30-minute checkout reservation policy.
- No Prisma migration is required.

## 0.51.0 - Phase 053: Variant availability & low-stock UX

### Changed
- Improved Flutter and website variant selection so unavailable combinations remain disabled and option changes prefer an in-stock exact match.
- Added low-stock messaging for concrete variants when five or fewer sellable units remain, while preserving SKU and live inventory visibility.
- Added a clearer disabled-state indicator to unavailable Flutter option chips without changing the locked black-and-lime visual system.
- Preserved server-authoritative cart inventory validation, account-only commerce rules, variant-specific media behavior, and the 30-minute checkout reservation policy.
- No Prisma migration is required.

## 0.50.4.5 - 2026-09-02

### Fixed
- Restored the exact Phase 052.4 black-and-lime Flutter authentication scaffold as the UI baseline after the incorrect header rollback.
- Reduced only the mobile authentication brand header height from 154px to 115px; all original Phase 052.4 layout, TEXTSHOP placement, back button, lime decoration, form spacing, and authentication behavior remain unchanged.
- No API, routing, JWT/session, commerce, database, or storefront Hero behavior changed.

## 0.50.4.2 - 2026-09-02

### Fixed
- Fixed the Flutter analyzer duplicate wildcard parameter definition in the notification list separator introduced by the previous lint cleanup.
- No UI, authentication, commerce, routing, or black-and-lime storefront visual behavior changed.

## 0.50.5 - Phase 052.4.1: Flutter auth compatibility & analyze fix

### Fixed
- Restored the `SignInPage.returnTo` contract required by the account-gated router so sign-in can safely return customers to Cart, Wishlist, Updates, Checkout, and other protected destinations.
- Preserved the Phase 052.4 black-and-lime authentication presentation while restoring the pre-existing post-login navigation behavior.
- Cleaned the auth scaffold child ordering lint and the existing notification flow-control lints so `flutter analyze` can return cleanly.
- No API, authentication protocol, commerce, payment, inventory, order, notification, or database behavior was changed. No Prisma migration is required.

## 0.50.4 - Phase 052.4: Black/Green Flutter authentication UI

### Changed
- Restyled Flutter sign-in, registration, and password-recovery screens to match the locked TextShop black-and-lime storefront identity.
- Added a responsive shared authentication scaffold with a dark brand panel, lime visual accent, and compact mobile presentation.
- Kept the existing customer authentication API, JWT/session behavior, validation, and routes intact.
- No Prisma migration is required.

## 0.50.3 - 2026-09-02

### Restored
- Restored the black-and-lime storefront visual identity requested for the Flutter home experience.
- Restored the dark hero banner with the lime accent composition and Explore collection CTA.
- Restored the matching Flutter theme tokens used by that hero without changing commerce, account, payment, inventory, order, return, or notification logic.

## 0.50.2 - Phase 052.2: Restore original Flutter storefront UI

- Reverted the Phase 052 and 052.1 Flutter presentation redesign back to the last stable pre-redesign storefront baseline from commit `5df5e87`.
- Restored the established Home, Product Card, Product Details, Cart, Checkout, Orders, Profile, main shell, and theme presentation without rolling back the underlying commerce features.
- Preserved Product Variant Matrix support, account-owned cart and wishlist behavior, checkout/payment flows, orders, returns, and notifications; this increment is presentation-only.
- Future visual work should refine the restored storefront incrementally rather than replacing its visual language wholesale.
- No Prisma migration is required. The 30-minute unpaid inventory reservation policy is unchanged.

## 0.50.1 - Phase 052.1: Flutter storefront visual polish

- Refined the Phase 052 design system with more deliberate typography, softer neutral surfaces, improved control sizing, navigation icon treatment, and tighter component consistency.
- Upgraded the Flutter home hero into a more editorial, responsive commerce banner with clearer merchandising hierarchy and stronger brand recognition.
- Improved discovery presentation with a clearer category eyebrow, larger search treatment, stronger section naming, and tuned responsive product-grid proportions.
- Polished product cards with cleaner image framing, loading treatment, live-stock cues, stronger price hierarchy, more refined promotion badges, and improved wishlist affordances.
- Added subtle bottom-navigation separation and storefront-oriented iconography without changing navigation structure or route behavior.
- Presentation only: no API, database, account ownership, pricing, inventory, payment, promotion, order, return, notification, or 30-minute reservation behavior changed.
- No Prisma migration is required.

## 0.50.0 - Phase 052: Flutter storefront UI/UX overhaul

- Rebuilt the Flutter visual system around a restrained modern-commerce language with neutral surfaces, stronger typography, tighter spacing, consistent controls, and a distinctive lime accent instead of generic Material defaults.
- Redesigned the mobile home experience with a branded editorial hero, cleaner search/category discovery, stronger product-section hierarchy, and a more product-led responsive grid.
- Reworked product cards with image-first composition, compact wishlist affordances, discount/sold-out badges, clearer pricing hierarchy, and less card chrome.
- Refined product details with a cleaner gallery, stronger merchandising hierarchy, grouped Phase 051 option selection, clearer inventory messaging, bag access, and a more deliberate trust panel.
- Refined cart, checkout, orders, account, and bottom navigation styling so the primary commerce journey now reads as one coherent application rather than separately assembled screens.
- This phase is presentation-focused: account ownership, trusted server pricing, cart/checkout/payment logic, wishlist sync, orders, returns, notifications, promotions, variant resolution, and the 30-minute unpaid inventory reservation policy are unchanged.
- No Prisma migration is required.

## 0.49.0 - Phase 051: Product options & variant matrix

- Added structured per-variant product options through `ProductVariant.optionValues`, while preserving legacy variant names for historical order snapshots and backward compatibility.
- Added Staff variant-matrix generation for 1–3 option dimensions with a hard 100-combination safety cap, deterministic SKU generation, duplicate-combination skipping, base pricing, compare-at pricing, and initial inventory per generated SKU.
- Upgraded the Staff Product Editor with a matrix generator for common Color/Size workflows plus editable structured option pairs on individual SKUs.
- Upgraded the Website product purchase panel from a flat variant list to grouped option selectors that resolve to a concrete SKU and disable unavailable downstream combinations.
- Upgraded Flutter product details to use the same structured option selection model while retaining fallback support for legacy variants that do not yet have option metadata.
- Cart, checkout, payments, order snapshots, inventory reservations, images, promotions, refunds, and returns continue to resolve against the selected concrete `variantId`; no client is trusted to derive commercial data.
- Added Prisma migration `20260901203000_product_variant_options`. The 30-minute unpaid inventory reservation policy is unchanged.

## 0.48.2 - Phase 050.2: Firebase Cloud Messaging runtime integration

- Upgraded Flutter push handling from token registration only to a real Firebase Messaging runtime with foreground, background, terminated-launch, token-refresh, and notification-tap handling.
- Push taps now route through the server-owned `actionPath` with an order-number fallback, so shipping/order notifications can open the correct account order screen.
- Foreground push messages refresh the account notification feed and surface an in-app action without depending on commerce UI state.
- Flutter push initialization is resilient when native Firebase configuration is not installed, and push now defaults on for Android/iOS while remaining explicitly disableable with `--dart-define=PUSH_ENABLED=false`.
- Backend push delivery now respects `PUSH_ENABLED`, validates `PUSH_DELIVERY_MODE`, requires `FCM_PROJECT_ID` for enabled FCM delivery, and includes `orderNumber` in FCM data payloads.
- Added push-delivery regression tests for disabled delivery, CONSOLE SENT persistence, and per-device idempotency.
- Added Firebase/FCM setup documentation using Google Application Default Credentials; no service-account secret is included in the repository or increment.
- No Prisma migration is required. Existing account ownership rules and the 30-minute inventory reservation policy are unchanged.

## 0.48.1 - Phase 050.1: Flutter push registration analyze fix

- Fixed invalid fire-and-forget syntax introduced in the Flutter push-registration lifecycle wiring.
- Replaced malformed `void futureCall()` expressions with Dart `unawaited(...)` calls so authentication and startup push sync remain non-blocking without analyzer errors.
- No Prisma migration is required. Push delivery behavior, account ownership, and the 30-minute inventory reservation policy are unchanged.

## 0.48.0 - Phase 050: Push notification foundation

- Added account-owned mobile push-device registration with per-token ownership, platform tracking, enable/disable state, and last-seen timestamps.
- Added persistent `PushDelivery` audit records with `PENDING`, `SENT`, and `FAILED` states and per-device event idempotency.
- Customer notification events now fan out independently to in-app notifications, transactional email, and push delivery; push failures never roll back commerce transactions.
- Added CONSOLE push delivery for development and FCM HTTP v1 delivery for production through Google Application Default Credentials.
- Added authenticated device register/unregister endpoints; logout disables the current device token and a token can safely move between accounts after a new login.
- Added optional Flutter Firebase Messaging registration behind `--dart-define=PUSH_ENABLED=true`, keeping push disabled by default until the Firebase native app configuration is installed.
- Added Prisma migration `20260901180000_push_notifications`. Existing account-only commerce rules and the 30-minute inventory reservation remain unchanged.

## 0.47.1 - Phase 049.1: Automated testing foundation

- Added a zero-database API unit-test foundation using Node's test runner through the existing `tsx` development dependency.
- Added transactional-email regression tests for console delivery, SENT/PENDING idempotency, and failure isolation when SMTP configuration is unavailable.
- Added notification regression tests for anonymous/account ownership behavior and notification-to-email event propagation.
- Added root `test:api`, `verify:server`, `verify:flutter`, and `verify` commands so routine regression checks can be run from one workspace entry point.
- The verification commands intentionally keep server builds and Flutter static analysis separate internally, making failures easier to locate while preserving a single `npm run verify` workflow.
- No database migration is required for this increment. Existing account-only commerce rules and the 30-minute inventory reservation remain unchanged.

## 0.47.0 - Phase 049: Transactional email system

- Added a persistent `EmailDelivery` audit model with `PENDING`, `SENT`, and `FAILED` states plus an idempotent event key to prevent duplicate transactional sends.
- Added a reusable transactional email delivery service with CONSOLE development delivery and SMTP production delivery, using the existing validated email environment configuration.
- Customer notification events now fan out to both the account-owned in-app notification center and transactional email without putting SMTP logic in order/payment UI services.
- Added a unified TextShop HTML/text email template with safe action links back to the relevant account order.
- Payment-confirmed, shipping lifecycle, refund-requested/completed, and return-requested/approved/rejected events now produce transactional email from the same server-owned event flow.
- Email failures are recorded and logged without rolling back payment, shipping, refund, or return business transactions.
- Added Prisma migration `20260901170500_transactional_email_delivery`.
- Existing account-only commerce rules, automatic promotions, delivery lifecycle, inventory auditing, and the 30-minute unpaid inventory reservation policy remain unchanged.

## 0.46.0 - Phase 048: Customer notification center

- Added account-owned persistent notifications with unread/read state and indexed per-user delivery history.
- Added authenticated notification APIs for feed, mark-read, and mark-all-read operations; notification ownership is enforced by the authenticated user ID.
- Staff order transitions now create customer notifications for Processing, Shipped (including courier/tracking), and Delivered events.
- Added a Website Updates center with unread badge, 30-second foreground polling, focus refresh, mark-read controls, and direct order navigation.
- Added a Flutter Updates center with pull-to-refresh, read state, order navigation, and logout invalidation so one account's notifications never remain visible to another account.
- The notification module is intentionally channel-agnostic so Phase 049 can fan the same domain events out to email/push without embedding delivery code inside order UI.
- Added Prisma migration `20260901164500_customer_notifications`.
- Existing account-only commerce, shipping lifecycle, promotions, refunds/returns, inventory auditing, and the 30-minute unpaid inventory reservation policy remain unchanged.

## 0.45.0 - Phase 047: Shipping & delivery management

- Added a real post-payment delivery lifecycle: `CONFIRMED → PROCESSING → SHIPPED → DELIVERED`, while retaining legacy `FULFILLED` records for historical compatibility.
- Added order-level courier, tracking number, optional tracking URL, processing timestamp, shipped timestamp, and delivered timestamp fields.
- Added protected Staff order actions to start processing, mark an order shipped with required courier/tracking details, and mark shipped orders delivered.
- Reworked `/staff/orders` into an order-and-delivery console with explicit lifecycle actions and a proper tracking-details dialog instead of browser prompts.
- Customer Website order details now show Processing/Shipped/Delivered timeline stages and a delivery panel with courier, tracking number, shipment dates, and an optional Track parcel link.
- Flutter Order details now mirror the delivery lifecycle, tracking information, shipment dates, and external tracking link.
- Return eligibility now accepts newly delivered orders while retaining legacy fulfilled-order compatibility.
- Staff dashboard delivered/fulfilled metrics include both new delivered orders and legacy fulfilled orders.
- Added Prisma migration `20260901163000_shipping_delivery_management`.
- Existing account-only transaction rules, refunds, returns, promotions, inventory auditing, and the 30-minute unpaid inventory reservation policy remain unchanged.

## 0.44.3 - Phase 046.3: Account ownership & guest access hardening

- Established the product rule **browse as guest, transact as an account** across the API, Website, and Flutter app.
- Guests may continue browsing catalog, search, categories, product details, prices, inventory visibility, and public review content, but account-owned commerce actions now require authentication.
- Cart mutations and reads, checkout/order creation, payment operations, order status/cancellation, refund requests, return requests, wishlist mutations, reviews, addresses, and order history are protected by the authenticated customer identity.
- Website Add to cart and Wishlist actions now send signed-out visitors to Sign in with a safe `returnTo` path and restore them to the originating shopping context after authentication.
- Website Cart and Checkout now show explicit account-required states instead of creating or using guest commerce state; guest-order access cookies are no longer issued by new checkout flows.
- Flutter Cart, Wishlist, Product actions, and Order details now enforce account access in the UI; signing out invalidates account-scoped providers and returns to the public storefront so the previous user’s state is not left visible.
- Account cart/wishlist data remains server-owned and keyed to `userId`, preserving cross-device restore for the same user while isolating different users.
- Legacy guest-order/session support remains in the database/service internals for historical compatibility, but new customer transaction endpoints no longer authorize anonymous commerce.
- No Prisma migration is required; the 30-minute unpaid inventory reservation policy is unchanged.

## 0.44.2 - Phase 046.2: Flutter checkout & payment parity

- Hardened Flutter checkout so once an order has been created, payment startup failures recover through that existing order instead of inviting a second checkout/order submission.
- Flutter now verifies the payment session amount/currency against the server-confirmed order total before opening or confirming payment.
- Stripe checkout now routes directly to the created Order details screen; returning to TextShop refreshes trusted order/payment state through the existing lifecycle observer.
- Development payment follows the payment provider returned by the backend and keeps duplicate taps locked while the flow is in progress.
- Payment recovery from Order details validates the trusted amount and provides clearer return-from-provider guidance.
- Automatic-promotion preview from Phase 046.1 remains visible in Flutter before order creation, while the final payable amount continues to come from the server-created order.
- No Prisma migration is required; the 30-minute unpaid inventory reservation policy is unchanged.

## 0.44.1 - Phase 046.1: Automatic promotion checkout preview

- Added a public server-backed promotion preview endpoint so eligible automatic discounts are visible before order submission.
- Website Checkout now displays the active automatic promotion, discount amount, and recalculated estimated total without requiring the customer to press Apply.
- Coupon Apply remains coupon-only; when both a coupon and an automatic promotion qualify, Checkout previews the same larger-discount/tie-to-coupon rule enforced by the server transaction.
- Flutter Checkout now previews automatic promotions and includes them in the order review total using the same selection rule.
- No Prisma migration is required; existing Phase 046 promotion rules and the 30-minute unpaid inventory reservation policy are unchanged.

## 0.44.0 - Phase 046: Automatic promotions engine

- Added scheduled automatic promotions with percentage/fixed discounts, minimum subtotal, optional maximum discount, priority, and product/category targeting.
- Checkout evaluates automatic promotions inside the same serializable transaction as inventory reservation and order creation.
- Automatic promotions do not stack with coupon codes: the larger eligible monetary discount wins, with an entered coupon winning equal-value ties.
- Multiple automatic promotions use the largest customer discount, with priority as the deterministic tie-breaker.
- Orders snapshot the applied automatic promotion name while preserving existing coupon snapshots and server-authoritative commercial totals.
- Added protected Staff APIs and `/staff/promotions/automatic` management UI.
- Existing refund/return calculations continue to use actual paid order totals, and the 30-minute unpaid inventory reservation policy is unchanged.
- Added Prisma migration `20260901150000_automatic_promotions`.

## 0.43.0 - Phase 045: Coupons, promotions & checkout discounts

- Added a first-class Coupon promotion model with percentage and fixed-amount discounts, minimum subtotal, optional maximum discount, active windows, global usage limits, and per-user usage limits.
- Added optional product/category coupon targeting; unrestricted coupons continue to apply across the eligible catalog.
- Added immutable CouponRedemption records linked to orders so historical discount usage and commercial totals remain auditable after promotion rules change.
- Added protected Staff promotion APIs and `/staff/promotions` management UI for creating, editing, activating/deactivating, targeting, and reviewing coupon usage.
- Added customer coupon validation and checkout integration across the Website and Flutter app; discount calculations are always recomputed by the NestJS backend rather than trusted from clients.
- Checkout now persists coupon code/name and discount snapshots on the order, and order details surface the applied promotion and discounted totals.
- Refund calculations continue to use the order's actual paid commercial total, preventing coupons from inflating refundable value.
- Existing inventory auditing, returns/RMA, fulfillment, media/catalog management, and the 30-minute unpaid inventory reservation policy remain unchanged.
- Added Prisma migration `20260901143000_coupon_promotions`.

## 0.42.0 - Phase 044: Media upload & category management

- Replaced the Staff Product Editor's manual image-URL workflow with direct JPG / PNG / WebP uploads from the administrator device.
- Added a dedicated API media-storage abstraction with 5 MB upload limits, MIME/signature validation, random immutable filenames, public cache headers, and runtime files excluded from Git.
- Uploaded catalog files are persisted outside PostgreSQL while ProductImage continues to store only the resulting URL and variant/primary metadata, preserving storage-provider portability.
- Removing a locally managed ProductImage also removes its owned media file; failed database attachment rolls back the newly uploaded file to avoid orphan accumulation.
- Added `MEDIA_PUBLIC_BASE_URL` / optional `MEDIA_LOCAL_ROOT` configuration for development and deployment-specific media addressing.
- Added protected Staff Category management for create, rename, slug, sort order, activation/deactivation, and deletion of unused categories.
- Category deletion is server-protected when products still reference the category; staff must deactivate it instead, preserving catalog relationships.
- Added `/staff/categories` and shared Staff navigation integration.
- No Prisma migration is required; the existing Category and ProductImage models are reused.
- Existing audited inventory changes, fulfillment, returns/refunds, checkout, and the 30-minute unpaid inventory reservation policy are unchanged.

## 0.41.0 - Phase 043: Admin product editor

- Added protected staff product creation and full product editing for name, slug, description, category, publishing state, and featured merchandising.
- Added `/staff/catalog/new` and `/staff/catalog/[productId]` product editor flows so catalog operations no longer require Prisma Studio.
- Added variant / SKU creation and editing for SKU code, variant name, selling price, compare-at price, currency, activation state, and initial inventory.
- Added safe SKU removal: variants referenced by orders or active carts are deactivated instead of physically deleted, preserving commerce history and referential integrity.
- Added URL-based product media management with shared or variant-specific image assignment and primary-image selection, building on the existing ProductImage model.
- Publishing is server-enforced: a product cannot be activated until it has at least one active SKU.
- Existing post-creation inventory changes continue to use Phase 042 audited inventory adjustments; the product editor cannot bypass reserved-stock protection.
- No Prisma migration is required for this phase; existing Product, ProductVariant, Inventory, ProductImage, Category, and order-history models are reused.
- Existing checkout, returns/refunds, fulfillment, and the 30-minute unpaid inventory reservation policy are unchanged.

## 0.40.1 - Phase 042.1: Inventory adjustment interaction fix

- Replaced chained browser `prompt()` dialogs with a first-class inventory adjustment dialog in the Staff Catalog.
- Added explicit quantity-change and required reason fields, live before/after inventory preview, reserved-stock validation, submit loading state, and visible success/error feedback.
- Added a Staff Catalog BFF route for inventory adjustment history and surfaced recent audited adjustments directly in the dialog.
- Stock adjustment semantics, server-side audit logging, and reserved-stock protection remain unchanged; no Prisma migration is required.

## 0.40.0 - Phase 042: Admin product & inventory management

- Added protected Staff Catalog operations for product visibility, featured merchandising, variant activation, and live inventory management.
- Added a dedicated `/staff/catalog` console with product/SKU search, product status filters, low-stock filtering, and variant-level operational controls.
- Inventory changes are server-authoritative adjustments rather than direct client writes; sellable quantity can never be reduced below currently reserved stock.
- Added immutable inventory adjustment audit records capturing actor, SKU/variant, quantity delta, before/after quantity, reason, and timestamp.
- Product and variant deactivation immediately removes them from the public catalog/cart mutation path while preserving historical order snapshots.
- Added Catalog navigation and low-stock drill-down to the existing Admin Commerce Console.
- Existing checkout, payment, return/refund processing, and the 30-minute unpaid inventory reservation policy are unchanged.
- Prisma migration `20260901123000_inventory_adjustment_audit` is required.

## 0.39.0 - Phase 041: Admin commerce console

- Added a protected staff commerce dashboard with live order, return, payment, and inventory health metrics.
- Added a dedicated staff order operations API and Website order console with status/payment filters and order-number/customer search.
- STAFF / ADMIN users can now move paid CONFIRMED orders to FULFILLED through a server-enforced operation instead of editing Prisma Studio.
- Fulfillment is idempotent, rejects unpaid/non-confirmed orders, and does not alter payment/refund or return state.
- Added shared staff navigation between Overview, Orders, and Returns operations.
- Existing return/refund processing and the 30-minute unpaid inventory reservation policy are unchanged.
- No Prisma migration is required for this phase.

## 0.38.0 - Phase 040: Return processing & warehouse operations

- Added first-class CUSTOMER / STAFF / ADMIN roles with server-enforced staff authorization; there is no public self-promotion path.
- Added a protected `/staff/returns` operations API and Website console for reviewing, approving, rejecting, receiving, inspecting, and completing return cases.
- Added warehouse inspection fields and explicit RESTOCK / QUARANTINE / DISCARD disposition handling.
- RESTOCK inventory mutations are idempotent via `restockedAt` and happen only after the refund is confirmed; requested or merely received returns never change sellable stock.
- Added return-linked partial refunds calculated only from immutable OrderItem price snapshots and returned quantities; clients cannot submit refund amounts.
- Added `PARTIALLY_REFUNDED` financial state so item-level returns do not incorrectly mark an entire order as fully refunded.
- Multiple completed returns are now supported while cumulative returned quantity is capped at the original purchased quantity.
- A return can only reach COMPLETED after every line is inspected and the provider refund is confirmed.
- Added Prisma migration `20260831231500_return_processing`.
- The existing 30-minute unpaid inventory reservation policy is unchanged.

## 0.37.0 - Phase 039: Returns / RMA foundation

- Added first-class ReturnRequest / ReturnItem persistence with REQUESTED / APPROVED / IN_TRANSIT / RECEIVED / REJECTED / CANCELLED / COMPLETED lifecycle states.
- Added item-level return requests for fulfilled, paid, signed-in customer orders; guest return initiation remains intentionally disabled.
- Added server-side validation that every returned line belongs to the order and cannot exceed the quantity originally purchased.
- Added return reason, condition, and disposition concepts so future warehouse/admin flows can separate customer intent from physical inspection and restocking decisions.
- Added Website and Flutter return entry points with selectable order lines and return-status visibility in order details.
- Direct refunds are now limited to paid CONFIRMED orders; FULFILLED orders must enter the return workflow before a refund can be issued.
- Refunds remain financially separate from returns, and return requests do not mutate inventory.
- Added Prisma migration `20260831223000_order_returns`.
- The existing 30-minute unpaid inventory reservation policy is unchanged.

## 0.36.0 - Phase 038: Full-order refund foundation

- Added first-class Refund persistence with REQUESTED / PROCESSING / REFUNDED / REJECTED / FAILED lifecycle states.
- Added secure full-order refund requests using the same signed-in / guest order ownership checks as order status and cancellation.
- Added provider-side refund support for Stripe and MANUAL_TEST, with server-authoritative amount calculation from the immutable order total.
- Added Stripe `refund.updated` webhook synchronization and idempotent payment/order REFUNDED state updates.
- Kept financial refunds separate from inventory restocking so future Returns/RMA workflows can decide when stock is physically returned.
- Added refund visibility and request actions to website and Flutter order details.
- Added Prisma migration `20260831210000_order_refunds`.
- The existing 30-minute unpaid inventory reservation policy is unchanged.

# Changelog

## [0.50.4] - 2026-09-02

### Changed
- Rebuilt the Flutter customer authentication experience around the locked TextShop black-and-lime visual system.
- Added a responsive branded auth shell: split-screen commerce identity panel on desktop and compact black/lime header on mobile.
- Restyled sign-in, registration, and password recovery forms while preserving the existing authentication, validation, routing, and API behavior.
- Kept the Phase 052.3 black/green storefront Hero as the visual baseline; no storefront Hero redesign is included in this increment.

### Technical
- Presentation-only Flutter change; no database migration and no backend contract changes.


All notable changes to TextShop will be documented in this file.

## [0.35.0] - 2026-08-31

### Added
- Payment Recovery flow for Website and Flutter order details.
- Website payment page now loads trusted order state before presenting payment actions, including order total and live reservation countdown.
- Flutter unpaid order details now provide a first-class `Continue payment` action and refresh order state when the app resumes from an external gateway.
- Gateway session inspection distinguishes open, paid, expired, and still-processing sessions before any retry is created.

### Changed
- Repeated payment requests for the same provider now resume an existing open provider session instead of creating duplicate payment records.
- If Stripe already reports the session as paid, the backend reconciles the existing payment instead of opening another Checkout session.
- Switching payment providers closes the previous open provider session before marking it superseded and creating the replacement.
- Expired provider sessions are marked failed and can only be replaced while the original order inventory reservation is still active.
- Payment retries no longer extend the order inventory reservation; the existing 30-minute reservation remains authoritative.

### Architecture & Security
- Provider status is verified server-side through the provider adapter boundary; browser/mobile redirects remain non-authoritative.
- Paid, cancelled, expired, or otherwise non-payable orders are blocked from starting another payment.
- Existing order ownership / guest order-token authorization remains unchanged.
- No Prisma migration is required.

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
