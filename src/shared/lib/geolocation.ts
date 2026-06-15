export interface CityDetectionResult {
  city: string | null
  lat?: number
  lon?: number
}

const LOCAL_FALLBACK: CityDetectionResult = { city: 'Warsaw', lat: 52.2297, lon: 21.0122 }

/**
 * Определяет город посетителя по заголовкам запроса.
 * 1) Vercel сам добавляет x-vercel-ip-city к каждому запросу (быстро, без доп. запросов).
 * 2) Если заголовка нет (локальная разработка / другой хостинг) — идём в ip-api.com по IP.
 */
export async function detectCityFromHeaders(headersList: Headers): Promise<CityDetectionResult> {
  const vercelCity = headersList.get('x-vercel-ip-city')
  if (vercelCity) {
    const lat = headersList.get('x-vercel-ip-latitude')
    const lon = headersList.get('x-vercel-ip-longitude')
    return {
      city: decodeURIComponent(vercelCity),
      lat: lat ? Number(lat) : undefined,
      lon: lon ? Number(lon) : undefined,
    }
  }

  const forwardedFor = headersList.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : ''

  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
    return LOCAL_FALLBACK
  }

  try {
    // ВАЖНО: добавлен status,message в fields — без этого data.status всегда undefined
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,city,lat,lon`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    if (data.status === 'success') {
      return { city: data.city ?? null, lat: data.lat, lon: data.lon }
    }
    return { city: null }
  } catch {
    return { city: null }
  }
}