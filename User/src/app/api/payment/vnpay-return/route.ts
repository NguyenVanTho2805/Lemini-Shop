import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const HASH_SECRET = process.env.VNPAY_HASH_SECRET ?? '';
const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:3001';
const BASE_URL = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';

function verifySignature(params: Record<string, string>, secret: string, receivedHash: string): boolean {
  const signData = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const computed = createHmac('sha512', secret).update(signData, 'utf-8').digest('hex');
  return computed === receivedHash;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => { params[k] = v; });

  const secureHash = params['vnp_SecureHash'] ?? '';
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const responseCode = params['vnp_ResponseCode'];
  const orderId = params['vnp_TxnRef'];
  const orderInfo = params['vnp_OrderInfo'] ?? '';
  const orderCode = orderInfo.split('Don hang ')[1]?.trim() ?? '';

  const isValid = !HASH_SECRET || verifySignature(params, HASH_SECRET, secureHash);

  if (!isValid) {
    return NextResponse.redirect(`${BASE_URL}/payment/failed?reason=invalid`);
  }

  if (responseCode === '00') {
    try {
      await fetch(`${ADMIN_API}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed', paymentMethod: 'vnpay' }),
      });
    } catch {
      console.error('VNPay: failed to update order', orderId);
    }
    return NextResponse.redirect(
      `${BASE_URL}/payment/success?code=${encodeURIComponent(orderCode)}`
    );
  }

  return NextResponse.redirect(
    `${BASE_URL}/payment/failed?code=${encodeURIComponent(orderCode)}&reason=${responseCode}`
  );
}
