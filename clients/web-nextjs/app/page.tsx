import type { Metadata } from 'next';
import { HomePageJsonLd } from './components/HomePageJsonLd';
import { HomePageView } from './components/HomePageView';
import { buildHomeMetadata } from '@/config/siteSeo';

export const metadata: Metadata = buildHomeMetadata();

export default function HomePage() {
  return (
    <>
      <HomePageJsonLd />
      <HomePageView />
    </>
  );
}
