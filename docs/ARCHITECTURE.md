# TextShop Architecture

## Responsibilities

### Next.js storefront
- Public product browsing
- SEO-friendly product URLs and metadata
- Web cart and checkout experience
- Customer account web UI

### Flutter mobile
- Android and iOS customer experience
- Native app navigation and device integrations
- Consumes the same public commerce API

### NestJS API
- Authentication and authorization
- Trusted product pricing
- Inventory validation and reservation
- Cart/order orchestration
- Payment provider webhooks
- Admin authorization

### PostgreSQL
- Durable commerce data
- Accessed only by server-side infrastructure through Prisma

## Rule

Clients may request business actions, but the server is authoritative for prices, inventory, order totals and payment state.
