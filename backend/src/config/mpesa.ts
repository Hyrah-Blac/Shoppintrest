import axios from 'axios'
import logger from '../utils/logger'

const getBaseUrl = () => {
  const env = process.env.MPESA_ENV || 'sandbox'
  return env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
}

// ─── GET OAUTH TOKEN ──────────────────────────────────────────────────────────
export const getMpesaToken = async (): Promise<string> => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  const response = await axios.get(
    `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
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
  const callbackUrl = process.env.MPESA_CALLBACK_URL!

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