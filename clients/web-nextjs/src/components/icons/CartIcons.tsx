import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps({ size = 20, ...props }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props
  };
}

export function IconMinus(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconCartPlus(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <path d="M2 2h2l2.4 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6L22 6H6" />
      <path d="M12 8v6M9 11h6" />
    </svg>
  );
}
