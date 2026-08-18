// src/app/api/revalidate/route.ts
//
// On-demand revalidation endpoint. The Node.js backend sends a signed POST
// request here whenever content changes (menu, articles, branches, etc.).
//
// Security model:
//   - HMAC-SHA256 signature over the raw JSON body using REVALIDATE_SECRET.
//   - Signature passed via `x-revalidation-signature` header.
//   - Timestamp passed via `x-revalidation-timestamp` header (ISO 8601).
//   - 5-minute replay-attack window: requests older than 300s are rejected.
//
// Body:
//   { tags: string[], paths?: string[] }
//
// Response: 200 { revalidated: true, results: [...] } or 401/400 on error.

import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import crypto from 'crypto'

const REPLAY_WINDOW_MS = 300000 // 5 minutes in milliseconds

function verifySignature(
  secret: string,
  body: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  console.log('[revalidate] REVALIDATE_SECRET loaded:', secret ? `${secret.substring(0, 4)}...` : 'UNDEFINED')

  if (!secret) {
    console.error('[revalidate] REVALIDATE_SECRET is not configured')
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET is not configured' },
      { status: 500 }
    )
  }

  const signature = req.headers.get('x-revalidation-signature')
  const timestamp = req.headers.get('x-revalidation-timestamp')

  console.log('[revalidate] received headers:', {
    'x-revalidation-signature': signature,
    'x-revalidation-timestamp': timestamp,
  })

  if (!signature || !timestamp) {
    console.error('[revalidate] missing required headers')
    return NextResponse.json(
      { error: 'Missing x-revalidation-signature or x-revalidation-timestamp header' },
      { status: 401 }
    )
  }

  // Replay-attack protection
  // Backend sends ISO 8601 (e.g. '2026-08-18T22:49:11.661Z'); parse as Date.
  const requestTime = new Date(timestamp).getTime()
  const now = Date.now()
  console.log('[revalidate] timestamp check:', {
    receivedTimestamp: timestamp,
    requestTime,
    now,
    diffMs: Number.isFinite(requestTime) ? now - requestTime : NaN,
    windowMs: REPLAY_WINDOW_MS,
  })
  if (!Number.isFinite(requestTime) || Math.abs(now - requestTime) > REPLAY_WINDOW_MS) {
    console.error('[revalidate] timestamp outside replay window')
    return NextResponse.json(
      { error: 'Timestamp outside replay window' },
      { status: 401 }
    )
  }

  // Read raw body for signature verification
  const rawBody = await req.text()
  console.log('[revalidate] raw body text:', rawBody)

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  console.log('[revalidate] signature comparison:', {
    receivedSignature: signature,
    expectedSignature: expected,
    match: signature === expected,
  })

  if (!verifySignature(secret, rawBody, signature)) {
    console.error('[revalidate] signature verification failed')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // Parse JSON body
  let body: { tags?: string[]; paths?: string[] }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const tags = Array.isArray(body.tags) ? body.tags : []
  const paths = Array.isArray(body.paths) ? body.paths : []

  if (tags.length === 0 && paths.length === 0) {
    return NextResponse.json(
      { error: 'No tags or paths provided' },
      { status: 400 }
    )
  }

  const results: { tag?: string; path?: string; revalidated: boolean }[] = []

  for (const tag of tags) {
    try {
      revalidateTag(tag, undefined as any)
      results.push({ tag, revalidated: true })
    } catch (err) {
      console.error(`[revalidate] failed to revalidate tag "${tag}":`, err)
      results.push({ tag, revalidated: false })
    }
  }

  for (const path of paths) {
    try {
      revalidatePath(path, undefined as any)
      results.push({ path, revalidated: true })
    } catch (err) {
      console.error(`[revalidate] failed to revalidate path "${path}":`, err)
      results.push({ path, revalidated: false })
    }
  }

  return NextResponse.json({ revalidated: true, results })
}