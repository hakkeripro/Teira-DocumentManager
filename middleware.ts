import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { newRequestId } from '@/lib/observability';

type NextCookieOptions = {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
};

type CookieToSet = {
  name: string;
  value: string;
  options?: NextCookieOptions;
};

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId = requestHeaders.get('x-request-id') ?? newRequestId();
  requestHeaders.set('x-request-id', requestId);

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('x-request-id', requestId);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env is missing, don't block local dev; just pass through.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        // Keep request cookies in sync (Supabase examples recommend this in middleware)
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Recreate the response so it includes updated request headers
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        response.headers.set('x-request-id', requestId);

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Fetch user (also refreshes session cookies when needed)
  const { data } = await supabase.auth.getUser();
  const isAuthed = Boolean(data?.user);

  const path = request.nextUrl.pathname;
  const isAppRoute = path.startsWith('/app');
  const isLoginRoute = path.startsWith('/login');

  // Optional debug (enable with DEBUG_AUTH=1)
  if (process.env.DEBUG_AUTH === '1') {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        at: 'middleware',
        path,
        isAuthed,
        hasSbCookie: request.cookies.getAll().some((c) => c.name.startsWith('sb-')),
        requestId,
      }),
    );
  }

  if (!isAppRoute || isLoginRoute) return response;

  if (!isAuthed) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', path);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.headers.set('x-request-id', requestId);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
