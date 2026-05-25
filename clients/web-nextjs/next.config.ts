import type { NextConfig } from 'next';
import path from 'path';

function buildRemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5090';
  const cdnBase = process.env.NEXT_PUBLIC_MEDIA_CDN_BASE_URL;

  try {
    const apiUrl = new URL(apiBase);
    patterns.push({
      protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
      hostname: apiUrl.hostname,
      port: apiUrl.port || undefined,
      pathname: '/assets/**'
    });
  } catch {
    patterns.push({
      protocol: 'http',
      hostname: 'localhost',
      port: '5090',
      pathname: '/assets/**'
    });
  }

  if (cdnBase) {
    try {
      const cdnUrl = new URL(cdnBase);
      patterns.push({
        protocol: cdnUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: cdnUrl.hostname,
        port: cdnUrl.port || undefined,
        pathname: '/**'
      });
    } catch {
      // ignore invalid CDN URL
    }
  }

  patterns.push({
    protocol: 'http',
    hostname: 'localhost',
    port: '9000',
    pathname: '/terravision-media/**'
  });

  return patterns;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@terravision/shared'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: buildRemotePatterns()
  }
};

export default nextConfig;
