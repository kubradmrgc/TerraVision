import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/siteSeo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicRoutes = ['/', '/products', '/marketplace', '/register', '/login'] as const;

  return publicRoutes.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'daily',
    priority: path === '/' ? 1 : 0.8
  }));
}
