import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await req.json();
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });

    // Vercel заголовки (на localhost будут fallback-значения)
    const ip         = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    const rawCity    = req.headers.get('x-vercel-ip-city');
    const city       = rawCity ? decodeURIComponent(rawCity) : 'Local';
    const userAgent  = req.headers.get('user-agent') ?? '';
    const date       = new Date().toISOString().slice(0, 10);

    // Определяем устройство
    const device = /mobile|android|iphone|ipad/i.test(userAgent) ? 'Mobile' : 'Desktop';

    // Анонимный хэш — не храним реальный IP
    const hash = createHash('sha256')
      .update(`${ip}-${userAgent}-${date}`)
      .digest('hex')
      .slice(0, 16);

    // Отправляем на бэкенд (fire & forget на уровне Next.js route)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/saas/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, hash, city, device, date }),
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Track failed' }, { status: 500 });
  }
}