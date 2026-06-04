import type { NextConfig } from 'next';
import path from 'path';

function addApiAssetPatterns(
  patterns: NonNullable<NextConfig['images']>['remotePatterns'],
  protocol: 'http' | 'https',
  hostname: string,
  port: string
): void {
  const hosts =
    hostname === 'localhost' || hostname === '127.0.0.1'
      ? (['localhost', '127.0.0.1'] as const)
      : ([hostname] as const);

  for (const host of hosts) {
    patterns.push({
      protocol,
      hostname: host,
      port: port || undefined,
      pathname: '/assets/**'
    });
  }
}

function buildRemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5090';
  const cdnBase = process.env.NEXT_PUBLIC_MEDIA_CDN_BASE_URL;

  try {
    const apiUrl = new URL(apiBase);
    addApiAssetPatterns(
      patterns,
      apiUrl.protocol.replace(':', '') as 'http' | 'https',
      apiUrl.hostname,
      apiUrl.port
    );
  } catch {
    addApiAssetPatterns(patterns, 'http', 'localhost', '5090');
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
