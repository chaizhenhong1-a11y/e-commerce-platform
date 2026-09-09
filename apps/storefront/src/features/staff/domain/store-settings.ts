export type StoreSettings = {
  id: string;
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
  timeZone: string;
  standardShippingCents: number;
  freeShippingThresholdCents: number;
  estimatedDelivery: string;
  deliveryPolicy: string;
  returnWindowDays: number;
  returnCondition: string;
  refundMethod: string;
  returnsPolicy: string;
  faqContent: string;
  trustSafetyContent: string;
  termsContent: string;
  privacyContent: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateStoreSettingsInput = Omit<
  StoreSettings,
  "id" | "createdAt" | "updatedAt"
>;
