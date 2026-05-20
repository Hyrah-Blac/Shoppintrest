import axios from 'axios'
import logger from '../utils/logger'

const MPESA_ENV = process.env.MPESA_ENV || 'sandbox'

const BASE_URL =
  MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY as string
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET as string
const SHORTCODE = process.env.MPESA_SHORTCODE as string
const PASSKEY = process.env.MPESA_PASSKEY as string
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL as string

// ─── GET OAUTH TOKEN ──────────────────────────────────────────────────────────
export const getMpesaToken = async (): Promise<string> => {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')

  const response = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  )

  return response.data.access_token
}

// ─── GENERATE PASSWORD ────────────────────────────────────────────────────────
export const getMpesaPassword = (): { password: string; timestamp: string } => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14)

  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')

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
  const token = await getMpesaToken()
  const { password, timestamp } = getMpesaPassword()

  // Normalize phone: 0712... → 254712...
  const normalizedPhone = normalizePhone(phone)

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount), // M-Pesa only accepts whole numbers
    PartyA: normalizedPhone,
    PartyB: SHORTCODE,
    PhoneNumber: normalizedPhone,
    CallBackURL: CALLBACK_URL,
    AccountReference: `SHOPPINTREST-${orderId}`,
    TransactionDesc: description,
  }

  logger.info(`Initiating STK Push for order ${orderId} → phone ${normalizedPhone}`)

  const response = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  return response.data
}

// ─── QUERY STK STATUS ─────────────────────────────────────────────────────────
export const queryStkStatus = async (checkoutRequestId: string) => {
  const token = await getMpesaToken()
  const { password, timestamp } = getMpesaPassword()

  const response = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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