import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'tc_session';

/**
 * The admin panel lives on its own hostname (admin.techconnect74.ru) and is
 * invisible from the public site, which returns 404 for anything under /admin.
 *
 * ADMIN_HOST is baked in at build time (see the Dockerfile ARG): middleware
 * runs in the Edge runtime, where env vars are inlined, so a value supplied
 * only at container start would not reach this code.
 *
 * When it is unset every host counts as the admin host, so `npm run dev` on
 * localhost behaves exactly as before — the split only activates where it is
 * configured.
 */
const ADMIN_HOST = process.env.ADMIN_HOST?.toLowerCase().trim();

/** Endpoints that only ever make sense on the admin host. */
const ADMIN_ONLY_API = ['/api/auth/', '/api/upload', '/api/media'];

function hostOf(req: NextRequest): string {
  // behind nginx the original name arrives in x-forwarded-host
  const raw = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  return raw.split(':')[0].toLowerCase();
}

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');

  // The host split only exists where ADMIN_HOST is configured. With it unset
  // (local development) nothing is rewritten at all: the public site stays at
  // "/" and the panel at "/admin", exactly as before.
  if (ADMIN_HOST) {
    if (hostOf(req) !== ADMIN_HOST) {
      // public site: the panel and its endpoints simply do not exist here
      if (isAdminPath || ADMIN_ONLY_API.some((p) => pathname.startsWith(p))) {
        // Rewriting to a path no route matches makes Next render not-found.tsx
        // with a genuine 404 — indistinguishable from a page never created.
        return NextResponse.rewrite(new URL('/__nonexistent', req.url));
      }
      return NextResponse.next();
    }

    // admin host: its root IS the panel
    if (pathname === '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.rewrite(url);
    }
  }

  // Only the panel needs a session; the login page must stay reachable.
  if (isAdminPath && pathname !== '/admin/login') {
    if (!(await isValidSession(req.cookies.get(COOKIE_NAME)?.value))) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Broad enough that the host check can also rewrite "/" on the admin host,
  // but static assets and image optimisation never pay for a JWT verification.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|uploads/|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|mp4|webm)$).*)',
  ],
};
