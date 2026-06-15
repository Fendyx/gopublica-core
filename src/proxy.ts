import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const { pathname } = req.nextUrl;

  // Системные пути не трогаем
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // /admin/* — без локали, просто добавляем tenant
  if (pathname.startsWith('/admin')) {
    const url = req.nextUrl.clone();
    url.pathname = `/${hostname}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Остальное — через next-intl (он сделает / -> /pl и т.д.)
  let response = handleI18nRouting(req);

  // response.ok = true только для 200-299 (т.е. не redirect и не ошибка)
  if (response.ok) {
    const rewriteHeader = response.headers.get('x-middleware-rewrite');
    const url = new URL(rewriteHeader || req.url);

    // добиваем tenant впереди, чтобы матчилось [tenantDomain]/[locale]
    url.pathname = `/${hostname}${url.pathname}`;

    response = NextResponse.rewrite(url, { headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};