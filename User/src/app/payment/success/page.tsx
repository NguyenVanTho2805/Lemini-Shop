import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fafafa',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '48px 40px',
        maxWidth: 460,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#f0fdf4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <CheckCircle size={40} color="#16a34a" strokeWidth={1.5} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>
          Thanh toán thành công!
        </h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 28, lineHeight: 1.6 }}>
          VNPay đã xác nhận thanh toán của bạn. Chúng tôi sẽ xử lý đơn hàng ngay.
        </p>

        {code && (
          <div style={{
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 10,
            padding: '14px 20px',
            marginBottom: 28,
          }}>
            <p style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Mã đơn hàng</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#2E1A4A', fontFamily: 'monospace' }}>
              {code}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/account/orders" style={{
            display: 'block',
            padding: '14px 24px',
            background: '#2E1A4A',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 700,
          }}>
            Xem đơn hàng của tôi
          </Link>
          <Link href="/" style={{
            display: 'block',
            padding: '12px 24px',
            background: 'transparent',
            color: '#888',
            borderRadius: 8,
            textDecoration: 'underline',
            fontSize: 13,
          }}>
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
