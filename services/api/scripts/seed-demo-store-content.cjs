require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing.');
}

const client = new Client({ connectionString });

const storeDesignPhotos = [
  'https://images.unsplash.com/photo-1771033834141-023d630b3965?auto=format&fit=crop&w=1200&h=1200&q=82',
  'https://images.unsplash.com/photo-1781967651630-e680c7bad016?auto=format&fit=crop&w=1200&h=1200&q=82',
  'https://images.unsplash.com/photo-1726128449240-6569b63355d2?auto=format&fit=crop&w=1200&h=1200&q=82',
  'https://images.unsplash.com/photo-1769107805412-90d9191d53e9?auto=format&fit=crop&w=1200&h=1200&q=82',
  'https://images.unsplash.com/photo-1765009433753-c7462637d21f?auto=format&fit=crop&w=1200&h=1200&q=82',
  'https://images.unsplash.com/photo-1776000680544-ebf0989a71df?auto=format&fit=crop&w=1200&h=1200&q=82',
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&h=1200&q=82',
  'https://images.unsplash.com/photo-1766934587214-86e21b3ae093?auto=format&fit=crop&w=1200&h=1200&q=82',
];

const photoSet = (offset) =>
  storeDesignPhotos.map(
    (_, index) => storeDesignPhotos[(index + offset) % storeDesignPhotos.length],
  );

const locations = [
  {
    id: 'demo-location-kl',
    name: 'TextShop Kuala Lumpur',
    description:
      'Our flagship city store with the widest TextShop selection, new arrivals, pickup support, and a relaxed space for discovering everyday essentials.',
    addressLine1: '168 Jalan Bukit Bintang',
    addressLine2: 'Bukit Bintang',
    city: 'Kuala Lumpur',
    state: 'Kuala Lumpur',
    postcode: '55100',
    countryCode: 'MY',
    phone: '+60 3-2148 8899',
    businessHours: 'Mon-Sun 10:00 AM-10:00 PM',
    isPrimary: true,
    isActive: true,
    sortOrder: 10,
    photos: photoSet(0),
  },
  {
    id: 'demo-location-pj',
    name: 'TextShop Petaling Jaya',
    description:
      'A convenient neighbourhood branch serving Petaling Jaya with curated collections, friendly assistance, and in-store order pickup.',
    addressLine1: '12 Jalan SS 21/39',
    addressLine2: 'Damansara Utama',
    city: 'Petaling Jaya',
    state: 'Selangor',
    postcode: '47400',
    countryCode: 'MY',
    phone: '+60 3-7728 2211',
    businessHours: 'Mon-Sun 10:00 AM-9:30 PM',
    isPrimary: false,
    isActive: true,
    sortOrder: 20,
    photos: photoSet(2),
  },
  {
    id: 'demo-location-subang',
    name: 'TextShop Subang Jaya',
    description:
      'Our Subang Jaya branch brings popular TextShop picks closer to the community, with easy collection and customer support.',
    addressLine1: '25 Jalan SS 15/4',
    addressLine2: 'SS15',
    city: 'Subang Jaya',
    state: 'Selangor',
    postcode: '47500',
    countryCode: 'MY',
    phone: '+60 3-5612 7788',
    businessHours: 'Mon-Sun 10:30 AM-9:30 PM',
    isPrimary: false,
    isActive: true,
    sortOrder: 30,
    photos: photoSet(4),
  },
  {
    id: 'demo-location-jb',
    name: 'TextShop Johor Bahru',
    description:
      'Our southern branch offers TextShop favourites, seasonal collections, pickup service, and local customer assistance in Johor Bahru.',
    addressLine1: '88 Jalan Wong Ah Fook',
    addressLine2: '',
    city: 'Johor Bahru',
    state: 'Johor',
    postcode: '80000',
    countryCode: 'MY',
    phone: '+60 7-223 6688',
    businessHours: 'Mon-Sun 10:00 AM-10:00 PM',
    isPrimary: false,
    isActive: true,
    sortOrder: 40,
    photos: photoSet(6),
  },
];

async function main() {
  await client.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE "StoreSettings"
       SET
         "storeName" = $1,
         "storeTagline" = $2,
         "storeDescription" = $3,
         "contactEmail" = $4,
         "contactPhone" = $5,
         "businessHours" = $6,
         "currency" = 'MYR',
         "timeZone" = 'Asia/Kuala_Lumpur',
         "standardShippingCents" = 800,
         "freeShippingThresholdCents" = 15000,
         "estimatedDelivery" = $7,
         "deliveryPolicy" = $8,
         "returnWindowDays" = 14,
         "returnCondition" = $9,
         "refundMethod" = $10,
         "returnsPolicy" = $11,
         "faqContent" = $12,
         "trustSafetyContent" = $13,
         "termsContent" = $14,
         "privacyContent" = $15,
         "updatedAt" = NOW()
       WHERE "id" = 'primary'`,
      [
        'TEST SUCCESS',
        'Everyday style, thoughtfully selected.',
        'TEST SUCCESS is a multi-location Malaysian retail concept focused on simple shopping, useful products, and dependable customer service. Browse online or visit one of our branches.',
        'support@testsuccess.my',
        '+60 3-2148 8899',
        'Customer support: Mon-Fri 9:00 AM-6:00 PM',
        '2-5 business days after dispatch',
        'Orders are processed on business days. Delivery times may vary during campaigns, public holidays, or for East Malaysia. Tracking details are provided when available.',
        'Unused, original condition and packaging',
        'Original payment method',
        'Proof of purchase is required. Final-sale, hygiene-sensitive, and personalised items may be excluded.',
        'How long does delivery take?\nMost orders arrive within 2-5 business days after dispatch.\n\nCan I collect from a store?\nStore pickup may be offered when the selected branch and item are eligible.\n\nHow do I track my order?\nTracking information is shown with your order when the courier provides it.\n\nCan I return an item bought online?\nEligible items can be returned according to our Returns policy.\n\nHow can I contact support?\nUse the Contact us page for the latest email, phone number, and support hours.',
        'We work to keep product, pricing, order, and store information clear and accurate. Payments should only be completed through official TextShop checkout flows. Never share passwords or one-time verification codes with anyone claiming to represent the store.',
        'By using this store, you agree to provide accurate order and contact information and to use the service lawfully. Product availability, prices, promotions, delivery estimates, and store hours may change. Orders may be cancelled or refunded when fulfilment is not possible.',
        'We use information needed to operate the store, process orders, provide support, improve the shopping experience, and meet legal obligations. Access to personal information is limited to authorised purposes. Payment information is handled through the configured payment provider rather than being stored as plain card details by the storefront.',
      ],
    );

    // Keep any real merchant locations intact. Only replace this script's own demo rows.
    await client.query(
      `UPDATE "StoreLocation" SET "isPrimary" = false, "updatedAt" = NOW()
       WHERE "isPrimary" = true`,
    );

    for (const location of locations) {
      const [coverUrl, ...galleryUrls] = location.photos;
      await client.query(
        `INSERT INTO "StoreLocation" (
          "id","name","addressLine1","addressLine2","city","state","postcode",
          "countryCode","phone","businessHours","description","coverUrl",
          "galleryUrls","isPrimary","isActive","sortOrder","createdAt","updatedAt"
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW()
        )
        ON CONFLICT ("id") DO UPDATE SET
          "name"=EXCLUDED."name",
          "addressLine1"=EXCLUDED."addressLine1",
          "addressLine2"=EXCLUDED."addressLine2",
          "city"=EXCLUDED."city",
          "state"=EXCLUDED."state",
          "postcode"=EXCLUDED."postcode",
          "countryCode"=EXCLUDED."countryCode",
          "phone"=EXCLUDED."phone",
          "businessHours"=EXCLUDED."businessHours",
          "description"=EXCLUDED."description",
          "coverUrl"=EXCLUDED."coverUrl",
          "galleryUrls"=EXCLUDED."galleryUrls",
          "isPrimary"=EXCLUDED."isPrimary",
          "isActive"=EXCLUDED."isActive",
          "sortOrder"=EXCLUDED."sortOrder",
          "updatedAt"=NOW()`,
        [
          location.id,
          location.name,
          location.addressLine1,
          location.addressLine2,
          location.city,
          location.state,
          location.postcode,
          location.countryCode,
          location.phone,
          location.businessHours,
          location.description,
          coverUrl,
          JSON.stringify(galleryUrls),
          location.isPrimary,
          location.isActive,
          location.sortOrder,
        ],
      );
    }

    await client.query('COMMIT');
    console.log('Demo store content seeded successfully.');
    console.log(`Locations: ${locations.length}`);
    console.log('Photos per demo location: 8 (1 cover + 7 gallery)');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
