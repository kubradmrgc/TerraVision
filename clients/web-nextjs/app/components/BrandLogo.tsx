import Image from 'next/image';
import Link from 'next/link';

type Props = {
  size?: number;
  showWordmark?: boolean;
  href?: string;
  className?: string;
};

export function BrandLogo({ size = 40, showWordmark = true, href, className = '' }: Props) {
  const content = (
    <>
      <Image
        src="/brand/terravision-logo.png"
        alt=""
        width={size}
        height={size}
        priority
        className="tv-brand-logo-img"
      />
      {showWordmark ? <span className="tv-brand-text">TerraVision</span> : null}
    </>
  );

  const wrapClass = `tv-brand${showWordmark ? '' : ' tv-brand--icon-only'} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={wrapClass} aria-label="TerraVision ana sayfa">
        {content}
      </Link>
    );
  }

  return <span className={wrapClass}>{content}</span>;
}
