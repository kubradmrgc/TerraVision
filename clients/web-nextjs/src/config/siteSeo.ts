import type { Metadata } from 'next';

export const SITE_NAME = 'TerraVision';
export const SITE_TAGLINE = 'Bitki ve bahçe alışveriş platformu';

export const SITE_DESCRIPTION =
  'TerraVision ile iç ve dış mekan bitkileri, saksılar ve bahçe ürünlerini keşfedin. Sepet, sipariş takibi, AR ürün önizleme ve TerraTakas tek platformda.';

export const SITE_KEYWORDS = [
  'bitki satış',
  'bahçe ürünleri',
  'iç mekan bitkileri',
  'saksı bitkileri',
  'bitki alışveriş',
  'AR bitki önizleme',
  'TerraVision',
  'TerraTakas',
  'online bitki mağazası'
];

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/terravision-logo.png`;

export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true }
    },
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      images: [{ url: DEFAULT_OG_IMAGE, alt: `${SITE_NAME} logosu` }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE]
    },
    alternates: {
      canonical: '/'
    }
  };
}

export function buildHomeMetadata(): Metadata {
  return {
    title: 'Online bitki ve bahçe alışverişi',
    description: SITE_DESCRIPTION,
    alternates: { canonical: '/' },
    openGraph: {
      title: `Online bitki ve bahçe alışverişi | ${SITE_NAME}`,
      description: SITE_DESCRIPTION,
      url: '/'
    }
  };
}
