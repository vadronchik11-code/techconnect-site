import type { Metadata, Viewport } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { SITE } from '@/lib/constants';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

// The gazette leans on heavy *italic* Montserrat throughout. Without the italic
// faces the browser synthesises an oblique, which is visibly wrong on Cyrillic —
// а, б, д, и, т have genuinely different italic letterforms, not just a slant.
const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: ['TechConnect', 'ЮУрГУ', 'митап', 'хакатон', 'форум', 'IT', 'практика', 'трудоустройство'],
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    type: 'website',
    locale: 'ru_RU',
    siteName: SITE.name,
  },
  // No `icons` block on purpose: an explicit one would override the file
  // conventions. src/app/{favicon.ico,icon.png,apple-icon.png} are picked up
  // automatically and emit the correct <link> tags for every browser.
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#a81313',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
