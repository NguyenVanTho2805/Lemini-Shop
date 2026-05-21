import Link from 'next/link';
import { XCircle } from 'lucide-react';

const REASON_MAP: Record<string, string> = {
  '07': 'Giao dịch bị nghi ngờ gian lận',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ',
  '10': 'Xác thực thẻ/tài khoản quá 3 lần',
  '11': 'Hết hạn chờ thanh toán',
  '12': 'Thẻ/Tài khoản bị khóa',
  '13': 'Sai mật khẩu OTP',
  '24': 'Bạn đã hủy giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Vượt hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng đang bảo trì',
  '79': 'Sai mật khẩu thanh toán quá số lần',
  invalid: 'Chữ ký không hợp lệ',
};

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; reason?: string }>;
}) {
  const { code, reason } = await searchParams;
  const reasonMsg = reason ? (REASON_MAP[reason] ?? `Mã lỗi: ${reason}`) : 'Thanh toán không thành công';

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
          background: '#fff5f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <XCircle size={40} color="#ef4444" strokeWidth={1.5} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>
          Thanh toán thất bại
        </h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
          {reasonMsg}
        </p>

        {code && (
          <div style={{
            background: '#fff5f5',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '12px 20px',
            marginBottom: 28,
            fontSize: 13,
            color: '#dc2626',
          }}>
            Đơn hàng <strong style={{ fontFamily: 'monospace' }}>{code}</strong> chưa được thanh toán.
            Đơn hàng vẫn được giữ — bạn có thể thử lại.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href="/" style={{
            display: 'block',
            padding: '14px 24px',
            background: '#2E1A4A',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 700,
          }}>
            Quay về trang chủ
          </Link>
          <Link href="/account/orders" style={{
            display: 'block',
            padding: '12px 24px',
            border: '1.5px solid #e8e8e8',
            color: '#555',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 13,
          }}>
            Xem đơn hàng của tôi
          </Link>
        </div>
      </div>
    </div>
  );
}
