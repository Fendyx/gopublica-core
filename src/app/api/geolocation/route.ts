import { NextResponse } from 'next/server'
import { detectCityFromHeaders } from '@/shared/lib/geolocation'

export async function GET(request: Request) {
  const result = await detectCityFromHeaders(request.headers)
  return NextResponse.json(result)
}