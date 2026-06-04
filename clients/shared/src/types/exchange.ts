export const EXCHANGE_CONDITION = {
  New: 1,
  Used: 2,
  Healthy: 3
} as const;

export type ExchangeCondition = (typeof EXCHANGE_CONDITION)[keyof typeof EXCHANGE_CONDITION];

export const EXCHANGE_PRODUCT_STATUS = {
  Available: 1,
  Pending: 2,
  Completed: 3
} as const;

export type ExchangeProductStatus = (typeof EXCHANGE_PRODUCT_STATUS)[keyof typeof EXCHANGE_PRODUCT_STATUS];

export const EXCHANGE_OFFER_TYPE = {
  Swap: 1,
  Buy: 2
} as const;

export type ExchangeOfferType = (typeof EXCHANGE_OFFER_TYPE)[keyof typeof EXCHANGE_OFFER_TYPE];

export const EXCHANGE_OFFER_STATUS = {
  Pending: 1,
  Accepted: 2,
  Rejected: 3
} as const;

export type ExchangeOfferStatus = (typeof EXCHANGE_OFFER_STATUS)[keyof typeof EXCHANGE_OFFER_STATUS];

export type ExchangeProductDto = {
  id: number;
  ownerId: number;
  ownerDisplayName: string;
  title: string;
  description: string;
  price: number;
  isSwapOnly: boolean;
  condition: ExchangeCondition;
  photoUrls: string[];
  isActive: boolean;
  status: ExchangeProductStatus;
  createdDate: string;
};

export type ExchangeOfferDto = {
  id: number;
  productId: number;
  productTitle: string;
  senderId: number;
  senderDisplayName: string;
  ownerId: number;
  offerType: ExchangeOfferType;
  message: string;
  status: ExchangeOfferStatus;
  createdDate: string;
};

export type CreateExchangeProductRequest = {
  title: string;
  description: string;
  price: number;
  condition: ExchangeCondition;
  photoUrls: string[];
};

export type CreateExchangeOfferRequest = {
  productId: number;
  offerType: ExchangeOfferType;
  message: string;
};

export type UpdateExchangeProductRequest = {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: ExchangeCondition;
  photoUrls: string[];
  isActive: boolean;
  status: ExchangeProductStatus;
};

export type ExchangeOfferReceivedEvent = {
  offerId: number;
  productId: number;
  productTitle: string;
  ownerId: number;
  senderId: number;
  senderDisplayName: string;
  offerType: ExchangeOfferType;
  message: string;
  occurredAtUtc: string;
};

export type ExchangeOfferStatusChangedEvent = {
  offerId: number;
  productId: number;
  senderId: number;
  status: ExchangeOfferStatus;
  occurredAtUtc: string;
};

export type ExchangeProductListedEvent = {
  product: ExchangeProductDto;
  occurredAtUtc: string;
};

export const EXCHANGE_CONDITION_LABELS: Record<ExchangeCondition, string> = {
  1: 'Yeni',
  2: 'Yaşlı',
  3: 'Sağlıklı'
};

/** İlan oluştururken seçilebilir durum etiketleri (tek seçim). */
export const EXCHANGE_CONDITION_TAG_OPTIONS: ReadonlyArray<{
  value: ExchangeCondition;
  label: string;
  hint: string;
}> = [
  { value: EXCHANGE_CONDITION.New, label: 'Yeni', hint: 'Az kullanılmış veya yeni alınmış' },
  { value: EXCHANGE_CONDITION.Healthy, label: 'Sağlıklı', hint: 'Bakımlı, canlı görünüm' },
  { value: EXCHANGE_CONDITION.Used, label: 'Yaşlı', hint: 'Olgun bitki, deneyimli bakım geçmişi' }
];

export const EXCHANGE_OFFER_TYPE_LABELS: Record<ExchangeOfferType, string> = {
  1: 'Takas',
  2: 'Satın alma'
};

export const EXCHANGE_OFFER_STATUS_LABELS: Record<ExchangeOfferStatus, string> = {
  1: 'Beklemede',
  2: 'Kabul edildi',
  3: 'Reddedildi'
};
