// Sadece sunucunun kendi kendine çağırdığı uçlar (e-posta gönderimi) için imza.
// Eskiden /api/email/* herkese açıktı: biri bizim adımıza, istediği adrese, istediği HTML'le e-posta yollayabiliyordu.
import { createHmac, timingSafeEqual } from 'crypto'

const secret = () => createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || '').update('cvzume-internal-v1').digest('hex')

export const internalHeaders = () => ({ 'Content-Type': 'application/json', 'x-cvzume-internal': secret() })

export function isInternalRequest(request: Request): boolean {
  const got = Buffer.from(request.headers.get('x-cvzume-internal') || '')
  const want = Buffer.from(secret())
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && got.length === want.length && timingSafeEqual(got, want)
}

export const escapeHtml = (v: unknown) =>
  String(v ?? '').slice(0, 200).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
