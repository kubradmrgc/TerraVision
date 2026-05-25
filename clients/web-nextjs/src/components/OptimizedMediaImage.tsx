'use client';

import Image, { type ImageProps } from 'next/image';
import { resolveMediaUrl } from '@/utils/mediaUrl';

type OptimizedMediaImageProps = Omit<ImageProps, 'src'> & {
  src: string;
};

/** Serves raster images via Next.js optimizer (WebP/AVIF, responsive sizes) for better LCP. */
export function OptimizedMediaImage({ src, alt, ...rest }: OptimizedMediaImageProps) {
  const resolved = resolveMediaUrl(src);
  if (!resolved) {
    return null;
  }

  return <Image src={resolved} alt={alt} {...rest} />;
}
