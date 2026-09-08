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
