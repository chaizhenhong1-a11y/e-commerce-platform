# TextShop

TextShop is the temporary working name for a professional single-merchant commerce platform. Branding can be changed later without changing the system boundaries.

## Workspace

```text
textshop/
├── apps/
│   ├── storefront/   # Next.js customer website
│   └── mobile/       # Flutter Android/iOS app
├── services/
│   └── api/          # NestJS API and Prisma boundary
├── docs/
├── package.json
└── CHANGELOG.md
```

## Production architecture

```text
Next.js Storefront ─┐
                    ├── HTTPS ──> NestJS API ──> Prisma ──> PostgreSQL
Flutter Android/iOS ┘
```

The client never owns trusted prices, inventory decisions, payment state, or database credentials. Those rules belong to the API.

## Local development

Install Node workspace dependencies from the root:

```bash
npm install
```

Run the website:

```bash
npm run dev:web
```

Run the API:

```bash
npm run dev:api
```

Prepare the Flutter mobile app separately:

```bash
cd apps/mobile
flutter create . --platforms=android,ios
flutter pub get
flutter run
```

## Current phase

Phase 002 establishes the multi-client architecture. The storefront currently uses a mock catalog while the API exposes clean health/catalog boundaries. Database-backed catalog, authentication, cart, checkout, inventory and payments will be added incrementally.

## Phase 021 database update

Account cart synchronization adds `Cart.userId`. After applying this increment,
run the Prisma migration and regenerate the API client before starting NestJS:

```powershell
cd "C:\flutter project\textshop"
npm --workspace @textshop/api run prisma:migrate
npm --workspace @textshop/api run prisma:generate
```
