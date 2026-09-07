import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/constants';

/**
 * Web app manifest — lets the site be added to a phone's home screen with the
 * brand icon instead of a screenshot thumbnail. Deliberately minimal: no
 * service worker, so this only affects installability and appearance, never
 * caching or offline behaviour.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#5a0d0d',
    theme_color: '#a81313',
    lang: 'ru',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android crops to its own shape; this one keeps the mark inside the safe zone.
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
