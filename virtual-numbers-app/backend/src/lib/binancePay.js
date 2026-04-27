import crypto from 'crypto';

const BASE_URL = 'https://bpay.binanceapi.com';

/**
 * Build the signature required by Binance Pay API.
 * Docs: https://developers.binance.com/docs/binance-pay/authentication
 */
function buildSignature(timestamp, nonce, body) {
  const payload = `${timestamp}\n${nonce}\n${JSON.stringify(body)}\n`;
  return crypto
    .createHmac('sha512', process.env.BINANCE_PAY_SECRET_KEY)
    .update(payload)
    .digest('hex')
    .toUpperCase();
}

function buildHeaders(body) {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex').toUpperCase();
  const signature = buildSignature(timestamp, nonce, body);

  return {
    'Content-Type': 'application/json',
    'BinancePay-Timestamp': timestamp,
    'BinancePay-Nonce': nonce,
    'BinancePay-Certificate-SN': process.env.BINANCE_PAY_API_KEY,
    'BinancePay-Signature': signature,
  };
}

/**
 * Create a Binance Pay order.
 * @param {object} params
 * @param {string} params.merchantTradeNo - Your unique order ID
 * @param {number} params.amount          - Amount in USD
 * @param {string} params.description     - Order description
 * @returns {Promise<{checkoutUrl: string, prepayId: string}>}
 */
export async function createBinancePayOrder({ merchantTradeNo, amount, description }) {
  const body = {
    env: { terminalType: 'WEB' },
    merchantTradeNo,
    orderAmount: amount.toFixed(2),
    currency: 'USDT',
    goods: {
      goodsType: '02',
      goodsCategory: 'Z000',
      referenceGoodsId: merchantTradeNo,
      goodsName: description,
    },
    returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?topup=success`,
    cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?topup=cancelled`,
    webhookUrl: `${process.env.BASE_URL}/webhooks/binance`,
  };

  const headers = buildHeaders(body);

  const response = await fetch(`${BASE_URL}/binancepay/openapi/v2/order`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.status !== 'SUCCESS') {
    throw new Error(data.errorMessage || 'Binance Pay order creation failed');
  }

  return {
    prepayId: data.data.prepayId,
    checkoutUrl: data.data.checkoutUrl,
  };
}

/**
 * Verify Binance Pay webhook signature.
 */
export function verifyBinanceWebhook(timestamp, nonce, body, signature) {
  const expected = buildSignature(timestamp, nonce, body);
  return expected === signature;
}
