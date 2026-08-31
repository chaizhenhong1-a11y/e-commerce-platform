import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductStatus } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed TextShop.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const catalog = [
  {
    slug: "everyday-canvas-tote",
    name: "Everyday Canvas Tote",
    description:
      "A clean everyday carry with a structured silhouette and roomy interior.",
    category: { name: "Bags", slug: "bags", sortOrder: 10 },
    sku: "TS-BAG-TOTE-001",
    variantName: "Natural",
    priceCents: 6900,
    quantity: 24,
    images: [
      ["/products/canvas-tote-main.svg", "Everyday Canvas Tote front view"],
      ["/products/canvas-tote-detail.svg", "Everyday Canvas Tote detail view"],
      ["/products/canvas-tote-side.svg", "Everyday Canvas Tote side view"],
    ],
  },
  {
    slug: "minimal-desk-lamp",
    name: "Minimal Desk Lamp",
    description:
      "Soft ambient light for workspaces, bedside tables, and reading corners.",
    category: { name: "Home", slug: "home", sortOrder: 20 },
    sku: "TS-HOME-LAMP-001",
    variantName: "Warm White",
    priceCents: 11900,
    quantity: 12,
    images: [
      ["/products/desk-lamp-main.svg", "Minimal Desk Lamp front view"],
      ["/products/desk-lamp-detail.svg", "Minimal Desk Lamp detail view"],
      ["/products/desk-lamp-side.svg", "Minimal Desk Lamp side view"],
    ],
  },
  {
    slug: "daily-steel-bottle",
    name: "Daily Steel Bottle",
    description:
      "A durable insulated bottle designed for commuting and daily routines.",
    category: { name: "Lifestyle", slug: "lifestyle", sortOrder: 30 },
    sku: "TS-LIFE-BOTTLE-001",
    variantName: "750 ml",
    priceCents: 4900,
    quantity: 36,
    images: [
      ["/products/steel-bottle-main.svg", "Daily Steel Bottle front view"],
      ["/products/steel-bottle-detail.svg", "Daily Steel Bottle detail view"],
      ["/products/steel-bottle-side.svg", "Daily Steel Bottle side view"],
    ],
  },
] as const;

async function main() {
  for (const item of catalog) {
    const category = await prisma.category.upsert({
      where: { slug: item.category.slug },
      update: {
        name: item.category.name,
        sortOrder: item.category.sortOrder,
        isActive: true,
      },
      create: {
        name: item.category.name,
        slug: item.category.slug,
        sortOrder: item.category.sortOrder,
        isActive: true,
      },
    });

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        categoryId: category.id,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
      },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        categoryId: category.id,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
      },
    });

    const variant = await prisma.productVariant.upsert({
      where: { sku: item.sku },
      update: {
        productId: product.id,
        name: item.variantName,
        priceCents: item.priceCents,
        currency: "MYR",
        isActive: true,
      },
      create: {
        productId: product.id,
        sku: item.sku,
        name: item.variantName,
        priceCents: item.priceCents,
        currency: "MYR",
        isActive: true,
      },
    });

    await prisma.inventory.upsert({
      where: { variantId: variant.id },
      update: { quantity: item.quantity },
      create: {
        variantId: variant.id,
        quantity: item.quantity,
        reserved: 0,
      },
    });

    for (const [index, [url, altText]] of item.images.entries()) {
      await prisma.productImage.upsert({
        where: {
          productId_url: {
            productId: product.id,
            url,
          },
        },
        update: {
          altText,
          sortOrder: index,
          isPrimary: index === 0,
        },
        create: {
          productId: product.id,
          url,
          altText,
          sortOrder: index,
          isPrimary: index === 0,
        },
      });
    }
  }

  console.log("TextShop seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
