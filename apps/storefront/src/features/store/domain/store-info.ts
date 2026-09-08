export type StoreLocation = {
  id: string; name: string; addressLine1: string; addressLine2: string; city: string; state: string; postcode: string; countryCode: string; phone: string; businessHours: string; description: string; coverUrl: string; galleryUrls: string[]; isPrimary: boolean; isActive: boolean; sortOrder: number;
};

export type StoreInfo = {
  storeName: string;
  logoUrl: string;
  storeCoverUrl: string;
  storeGalleryUrls: string[];
  storeTagline: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  businessHours: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  countryCode: string;
  currency: string;
  standardShippingCents: number;
  freeShippingThresholdCents: number;
  deliveryPolicy: string;
  returnsPolicy: string;
  faqContent: string;
  trustSafetyContent: string;
  termsContent: string;
  privacyContent: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  updatedAt: string;
  locations: StoreLocation[];
};

export type StoreInfoSection =
  | "about"
  | "delivery"
  | "returns"
  | "contact"
  | "faq"
  | "trust"
  | "terms"
  | "privacy";
