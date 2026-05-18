import { TextStyle } from 'react-native';

export const mobileTypography = {
  brandTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.4
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22
  },
  bodySm: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.3
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.2
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.2
  },
  pill: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const
  }
} satisfies Record<string, TextStyle>;
