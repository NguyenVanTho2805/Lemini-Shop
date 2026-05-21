import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';

const TMN_CODE = process.env.VNPAY_TMN_CODE ?? '';
const HASH_SECRET = process.env.VNPAY_HASH_SECRET ?? '';
const VNPAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

function getIpAddr(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

function formatVnDate(date: Date): string {
  const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return vnDate.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
}

function buildSignData(params: Record<string, string>): string {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

function buildPaymentUrl(params: Record<string, string>, hash: string): string {
  const query = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return `${VNPAY_URL}?${query}&vnp_SecureHash=${hash}`;
}

export async function POST(req: NextRequest) {
  if (!TMN_CODE || !HASH_SECRET) {
    return Response.json({ error: 'VNPay chưa được cấu hình' }, { status: 503 });
  }

  const { orderId, orderCode, amount } = (await req.json()) as {
    orderId: string;
    orderCode: string;
    amount: number;
  };

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
  const returnUrl = `${baseUrl}/api/payment/vnpay-return`;

  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: TMN_CODE,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `[${orderId}] Don hang ${orderCode}`,
    vnp_OrderType: 'other',
    vnp_Amount: String(Math.round(amount) * 100),
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: getIpAddr(req),
    vnp_CreateDate: formatVnDate(new Date()),
  };

  const signData = buildSignData(params);
  const hash = createHmac('sha512', HASH_SECRET).update(signData, 'utf-8').digest('hex');
  const paymentUrl = buildPaymentUrl(params, hash);

  return Response.json({ paymentUrl });
}
