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

type SeedVariant = {
  sku: string;
  name: string;
  priceCents: number;
  compareAtCents?: number;
  quantity: number;
  optionValues?: Record<string, string>;
};

type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  category: { name: string; slug: string; sortOrder: number };
  details: {
    material?: string;
    dimensions?: string;
    care?: string;
    highlights?: string[];
    specifications?: Record<string, string>;
  };
  colorSwatches?: Record<string, string>;
  images: Array<[string, string]>;
  variants: SeedVariant[];
};

const photo = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

// Demo catalog only. Photos are real Pexels stock photographs, not generated images.
const catalog: SeedProduct[] = [
  {
    slug: "studio-wide-leg-pants",
    name: "Studio Wide-Leg Pants",
    description: "Relaxed everyday trousers with a clean wide-leg silhouette.",
    category: { name: "Clothing", slug: "clothing", sortOrder: 10 },
    details: { material: "Cotton blend", care: "Machine wash cold", highlights: ["Relaxed wide-leg fit", "Everyday mid-rise cut"], specifications: { Fit: "Relaxed", Style: "Wide leg" } },
    colorSwatches: { Black: "#171717", Navy: "#1E2A44" },
    images: [
      [photo(33055598), "Studio Wide-Leg Pants front view"],
      [photo(19995459), "Studio Wide-Leg Pants styled view"],
      [photo(28168174), "Studio Wide-Leg Pants alternate view"],
    ],
    variants: [
      { sku: "TS-PANTS-BLK-S", name: "Black / S", priceCents: 8900, compareAtCents: 10900, quantity: 18, optionValues: { Color: "Black", Size: "S" } },
      { sku: "TS-PANTS-BLK-M", name: "Black / M", priceCents: 8900, compareAtCents: 10900, quantity: 24, optionValues: { Color: "Black", Size: "M" } },
      { sku: "TS-PANTS-NVY-M", name: "Navy / M", priceCents: 8900, compareAtCents: 10900, quantity: 12, optionValues: { Color: "Navy", Size: "M" } },
      { sku: "TS-PANTS-NVY-L", name: "Navy / L", priceCents: 8900, compareAtCents: 10900, quantity: 9, optionValues: { Color: "Navy", Size: "L" } },
    ],
  },
  {
    slug: "essential-cargo-trousers",
    name: "Essential Cargo Trousers",
    description: "Utility-inspired cargo trousers for casual daily styling.",
    category: { name: "Clothing", slug: "clothing", sortOrder: 10 },
    details: { material: "Cotton twill", care: "Machine wash cold", highlights: ["Utility pockets", "Relaxed silhouette"] },
    colorSwatches: { Beige: "#D8C3A5", White: "#F4F1EA" },
    images: [
      [photo(6503007), "Essential Cargo Trousers front view"],
      [photo(5365474), "Essential Cargo Trousers street styling"],
      [photo(5366340), "Essential Cargo Trousers alternate styling"],
    ],
    variants: [
      { sku: "TS-CARGO-BGE-S", name: "Beige / S", priceCents: 9900, quantity: 15, optionValues: { Color: "Beige", Size: "S" } },
      { sku: "TS-CARGO-BGE-M", name: "Beige / M", priceCents: 9900, quantity: 20, optionValues: { Color: "Beige", Size: "M" } },
      { sku: "TS-CARGO-WHT-M", name: "White / M", priceCents: 9900, quantity: 8, optionValues: { Color: "White", Size: "M" } },
      { sku: "TS-CARGO-WHT-L", name: "White / L", priceCents: 9900, quantity: 11, optionValues: { Color: "White", Size: "L" } },
    ],
  },
  {
    slug: "everyday-white-sneakers",
    name: "Everyday White Sneakers",
    description: "Minimal low-profile sneakers made for everyday outfits.",
    category: { name: "Shoes", slug: "shoes", sortOrder: 20 },
    details: { material: "Synthetic upper / rubber sole", care: "Wipe clean", highlights: ["Cushioned footbed", "Everyday neutral styling"] },
    colorSwatches: { White: "#F7F7F5" },
    images: [
      [photo(33231313), "Everyday White Sneakers hero view"],
      [photo(6705219), "Everyday White Sneakers side detail"],
      [photo(6748354), "Everyday White Sneakers alternate view"],
    ],
    variants: [
      { sku: "TS-SNK-WHT-38", name: "White / 38", priceCents: 12900, quantity: 10, optionValues: { Color: "White", Size: "38" } },
      { sku: "TS-SNK-WHT-39", name: "White / 39", priceCents: 12900, quantity: 14, optionValues: { Color: "White", Size: "39" } },
      { sku: "TS-SNK-WHT-40", name: "White / 40", priceCents: 12900, quantity: 17, optionValues: { Color: "White", Size: "40" } },
      { sku: "TS-SNK-WHT-41", name: "White / 41", priceCents: 12900, quantity: 7, optionValues: { Color: "White", Size: "41" } },
    ],
  },
  {
    slug: "street-high-top-sneakers",
    name: "Street High-Top Sneakers",
    description: "Chunky high-top sneakers with a soft neutral palette.",
    category: { name: "Shoes", slug: "shoes", sortOrder: 20 },
    details: { material: "Synthetic leather", care: "Spot clean only", highlights: ["High-top profile", "Padded collar"] },
    colorSwatches: { Cream: "#E8DDC8", Brown: "#6B4A36" },
    images: [
      [photo(31078822), "Street High-Top Sneakers hero view"],
      [photo(6158682), "Street High-Top Sneakers detail view"],
      [photo(12279148), "Street High-Top Sneakers boxed view"],
    ],
    variants: [
      { sku: "TS-HIGHTOP-CRM-39", name: "Cream / 39", priceCents: 14900, quantity: 8, optionValues: { Color: "Cream", Size: "39" } },
      { sku: "TS-HIGHTOP-CRM-40", name: "Cream / 40", priceCents: 14900, quantity: 13, optionValues: { Color: "Cream", Size: "40" } },
      { sku: "TS-HIGHTOP-BRN-40", name: "Brown / 40", priceCents: 14900, quantity: 6, optionValues: { Color: "Brown", Size: "40" } },
      { sku: "TS-HIGHTOP-BRN-41", name: "Brown / 41", priceCents: 14900, quantity: 10, optionValues: { Color: "Brown", Size: "41" } },
    ],
  },
  {
    slug: "weekend-layer-jacket",
    name: "Weekend Layer Jacket",
    description: "A versatile casual jacket designed for easy layering.",
    category: { name: "Clothing", slug: "clothing", sortOrder: 10 },
    details: { material: "Cotton canvas", care: "Gentle machine wash", highlights: ["Layer-friendly cut", "Everyday utility styling"] },
    colorSwatches: { Brown: "#795548", Black: "#202020" },
    images: [
      [photo(13258257), "Weekend Layer Jacket hero view"],
      [photo(26964991), "Weekend Layer Jacket styled view"],
      [photo(16791407), "Weekend Layer Jacket alternate view"],
    ],
    variants: [
      { sku: "TS-JKT-BRN-M", name: "Brown / M", priceCents: 15900, quantity: 9, optionValues: { Color: "Brown", Size: "M" } },
      { sku: "TS-JKT-BRN-L", name: "Brown / L", priceCents: 15900, quantity: 7, optionValues: { Color: "Brown", Size: "L" } },
      { sku: "TS-JKT-BLK-M", name: "Black / M", priceCents: 15900, quantity: 11, optionValues: { Color: "Black", Size: "M" } },
      { sku: "TS-JKT-BLK-L", name: "Black / L", priceCents: 15900, quantity: 5, optionValues: { Color: "Black", Size: "L" } },
    ],
  },
  {
    slug: "classic-white-tee",
    name: "Classic White Tee",
    description: "A simple crew-neck tee for a clean everyday wardrobe.",
    category: { name: "Clothing", slug: "clothing", sortOrder: 10 },
    details: { material: "100% cotton", care: "Machine wash at 30°C", highlights: ["Soft jersey cotton", "Regular fit"] },
    colorSwatches: { White: "#FFFFFF", Black: "#111111" },
    images: [[photo(20525730), "Classic White Tee"]],
    variants: [
      { sku: "TS-TEE-WHT-S", name: "White / S", priceCents: 4900, quantity: 30, optionValues: { Color: "White", Size: "S" } },
      { sku: "TS-TEE-WHT-M", name: "White / M", priceCents: 4900, quantity: 28, optionValues: { Color: "White", Size: "M" } },
      { sku: "TS-TEE-BLK-M", name: "Black / M", priceCents: 4900, quantity: 22, optionValues: { Color: "Black", Size: "M" } },
      { sku: "TS-TEE-BLK-L", name: "Black / L", priceCents: 4900, quantity: 19, optionValues: { Color: "Black", Size: "L" } },
    ],
  },
  {
    slug: "city-accessory-set",
    name: "City Accessory Set",
    description: "A compact accessories set for polished everyday styling.",
    category: { name: "Accessories", slug: "accessories", sortOrder: 30 },
    details: { material: "Mixed materials", highlights: ["Gift-ready styling", "Neutral everyday palette"] },
    colorSwatches: { Black: "#111111", Silver: "#B8B8B8" },
    images: [[photo(28719728), "City Accessory Set"]],
    variants: [
      { sku: "TS-ACC-BLK", name: "Black", priceCents: 7900, quantity: 18, optionValues: { Color: "Black" } },
      { sku: "TS-ACC-SLV", name: "Silver", priceCents: 7900, quantity: 14, optionValues: { Color: "Silver" } },
    ],
  },
  {
    slug: "minimal-fashion-bundle",
    name: "Minimal Fashion Bundle",
    description: "A coordinated casual essentials bundle for daily wear.",
    category: { name: "Lifestyle", slug: "lifestyle", sortOrder: 40 },
    details: { highlights: ["Coordinated casual essentials", "Easy gifting option"], specifications: { Bundle: "5-piece styling set" } },
    images: [[photo(9065153), "Minimal Fashion Bundle"]],
    variants: [
      { sku: "TS-BUNDLE-STD", name: "Standard Set", priceCents: 18900, quantity: 10 },
    ],
  },
  {
    slug: "neutral-wardrobe-set",
    name: "Neutral Wardrobe Set",
    description: "A neutral-toned fashion set built around versatile daily pieces.",
    category: { name: "Lifestyle", slug: "lifestyle", sortOrder: 40 },
    details: { highlights: ["Neutral palette", "Smart-casual styling"] },
    images: [[photo(18533675), "Neutral Wardrobe Set"]],
    variants: [
      { sku: "TS-WARDROBE-S", name: "Small Set", priceCents: 21900, quantity: 6, optionValues: { Size: "S" } },
      { sku: "TS-WARDROBE-M", name: "Medium Set", priceCents: 21900, quantity: 8, optionValues: { Size: "M" } },
      { sku: "TS-WARDROBE-L", name: "Large Set", priceCents: 21900, quantity: 5, optionValues: { Size: "L" } },
    ],
  },
  {
    slug: "daily-outfit-kit",
    name: "Daily Outfit Kit",
    description: "A casual outfit kit with simple staples for everyday rotation.",
    category: { name: "Lifestyle", slug: "lifestyle", sortOrder: 40 },
    details: { highlights: ["Casual daily styling", "Easy mix-and-match pieces"] },
    colorSwatches: { Black: "#171717", Blue: "#3F5F8A" },
    images: [[photo(1670770), "Daily Outfit Kit"]],
    variants: [
      { sku: "TS-OUTFIT-BLK-M", name: "Black / M", priceCents: 16900, quantity: 12, optionValues: { Color: "Black", Size: "M" } },
      { sku: "TS-OUTFIT-BLK-L", name: "Black / L", priceCents: 16900, quantity: 10, optionValues: { Color: "Black", Size: "L" } },
      { sku: "TS-OUTFIT-BLU-M", name: "Blue / M", priceCents: 16900, quantity: 7, optionValues: { Color: "Blue", Size: "M" } },
      { sku: "TS-OUTFIT-BLU-L", name: "Blue / L", priceCents: 16900, quantity: 9, optionValues: { Color: "Blue", Size: "L" } },
    ],
  },
];

async function main() {
  for (const item of catalog) {
    const category = await prisma.category.upsert({
      where: { slug: item.category.slug },
      update: { name: item.category.name, sortOrder: item.category.sortOrder, isActive: true },
      create: { ...item.category, isActive: true },
    });

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        details: item.details,
        colorSwatches: item.colorSwatches ?? {},
        categoryId: category.id,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
      },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        details: item.details,
        colorSwatches: item.colorSwatches ?? {},
        categoryId: category.id,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
      },
    });

    for (const itemVariant of item.variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: itemVariant.sku },
        update: {
          productId: product.id,
          name: itemVariant.name,
          priceCents: itemVariant.priceCents,
          compareAtCents: itemVariant.compareAtCents ?? null,
          currency: "MYR",
          optionValues: itemVariant.optionValues ?? {},
          isActive: true,
        },
        create: {
          productId: product.id,
          sku: itemVariant.sku,
          name: itemVariant.name,
          priceCents: itemVariant.priceCents,
          compareAtCents: itemVariant.compareAtCents ?? null,
          currency: "MYR",
          optionValues: itemVariant.optionValues ?? {},
          isActive: true,
        },
      });

      await prisma.inventory.upsert({
        where: { variantId: variant.id },
        update: { quantity: itemVariant.quantity },
        create: { variantId: variant.id, quantity: itemVariant.quantity, reserved: 0 },
      });
    }

    for (const [index, [url, altText]] of item.images.entries()) {
      await prisma.productImage.upsert({
        where: { productId_url: { productId: product.id, url } },
        update: { altText, sortOrder: index, isPrimary: index === 0 },
        create: { productId: product.id, url, altText, sortOrder: index, isPrimary: index === 0 },
      });
    }
  }

  console.log(`TextShop demo seed completed: ${catalog.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
