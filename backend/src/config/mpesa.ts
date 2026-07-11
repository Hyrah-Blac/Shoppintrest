import axios from 'axios'
import logger from '../utils/logger'

const getBaseUrl = () => {
  const env = process.env.MPESA_ENV || 'sandbox'
  return env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
}

// Every request to Safaricom gets a hard timeout so a hung sandbox call
// fails fast instead of leaving a checkout looking stuck indefinitely.
const REQUEST_TIMEOUT_MS = 15_000

// ─── OAUTH TOKEN (cached) ─────────────────────────────────────────────────────
// Previously this fetched a brand-new token on every single call — including
// every 5-second status poll from the checkout page. That added a full extra
// round-trip to Safaricom's OAuth endpoint before the real request even went
// out, and repeatedly hammering that endpoint risks Safaricom throttling it.
// Tokens are valid ~3600s; cache it and only refetch a little before expiry.
let cachedToken: { token: string; expiresAt: number } | null = null

export const getMpesaToken = async (): Promise<string> => {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY!
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  const response = await axios.get(
    `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      timeout: REQUEST_TIMEOUT_MS,
    }
  )

  const token = response.data.access_token
  // expires_in is seconds (Safaricom default 3600). Refresh 60s early so we
  // never hand out a token that's about to expire mid-request.
  const expiresInMs = (parseInt(response.data.expires_in, 10) || 3600) * 1000
  cachedToken = { token, expiresAt: now + expiresInMs - 60_000 }

  return token
}

// ─── GENERATE PASSWORD ────────────────────────────────────────────────────────
export const getMpesaPassword = (): { password: string; timestamp: string } => {
  const shortcode = process.env.MPESA_SHORTCODE!
  const passkey = process.env.MPESA_PASSKEY!

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14)

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

  return { password, timestamp }
}

// ─── STK PUSH ─────────────────────────────────────────────────────────────────
export const initiateStkPush = async ({
  phone,
  amount,
  orderId,
  description,
}: {
  phone: string
  amount: number
  orderId: string
  description: string
}) => {
  const shortcode = process.env.MPESA_SHORTCODE!
  // A secret token is appended to the callback URL rather than relying on
  // Safaricom's source IP — hosting platforms that proxy requests through
  // their own internal network (Render, etc.) can make req.ip show an
  // internal hop's address instead of Safaricom's real IP, which would
  // otherwise cause every legitimate callback to be rejected.
  const baseCallbackUrl = process.env.MPESA_CALLBACK_URL!
  const callbackSecret = process.env.MPESA_CALLBACK_SECRET!
  const callbackUrl = `${baseCallbackUrl}${baseCallbackUrl.includes('?') ? '&' : '?'}secret=${encodeURIComponent(callbackSecret)}`

  const token = await getMpesaToken()
  const { password, timestamp } = getMpesaPassword()

  const normalizedPhone = normalizePhone(phone)

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: normalizedPhone,
    PartyB: shortcode,
    PhoneNumber: normalizedPhone,
    CallBackURL: callbackUrl,
    AccountReference: `SHOPPINTREST-${orderId}`,
    TransactionDesc: description,
  }

  logger.info(`Initiating STK Push for order ${orderId} → phone ${normalizedPhone}`)

  const response = await axios.post(
    `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: REQUEST_TIMEOUT_MS,
    }
  )

  return response.data
}

// ─── QUERY STK STATUS ─────────────────────────────────────────────────────────
export const queryStkStatus = async (checkoutRequestId: string) => {
  const shortcode = process.env.MPESA_SHORTCODE!
  const token = await getMpesaToken()
  const { password, timestamp } = getMpesaPassword()

  const response = await axios.post(
    `${getBaseUrl()}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: REQUEST_TIMEOUT_MS,
    }
  )

  return response.data
}

// ─── PHONE NORMALIZER ─────────────────────────────────────────────────────────
export const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`
  if (cleaned.startsWith('254')) return cleaned
  if (cleaned.startsWith('+254')) return cleaned.slice(1)
  return `254${cleaned}`
}