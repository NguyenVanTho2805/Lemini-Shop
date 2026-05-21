import { Resend } from 'resend';
import type { AdminOrder } from './orderStore';

export const USE_EMAIL = !!process.env.RESEND_API_KEY;

const resend = USE_EMAIL ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || 'Lemini <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xác nhận',
  shipping: 'Đang giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  shipping: '#3B82F6',
  completed: '#22C55E',
  cancelled: '#EF4444',
};

function baseLayout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <!-- Header -->
        <tr><td style="background:#5C3D2E;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:-0.5px">Lemini</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">Thêu tay thủ công Việt Nam</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;border-radius:0 0 12px 12px">
          ${body}
          <!-- Footer -->
          <hr style="border:none;border-top:1px solid #EDE8E3;margin:28px 0">
          <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center">
            © 2026 Lemini · Thêu tay thủ công Việt Nam<br>
            Email này được gửi tự động, vui lòng không reply.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTable(order: AdminOrder) {
  const rows = order.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151">
        ${item.name} <span style="color:#9CA3AF">x${item.quantity}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;font-size:14px;color:#374151;text-align:right;white-space:nowrap">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>`).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">
      <tr>
        <th style="padding:8px 0;font-size:12px;color:#6B7280;text-align:left;font-weight:600;border-bottom:2px solid #E5E7EB">SẢN PHẨM</th>
        <th style="padding:8px 0;font-size:12px;color:#6B7280;text-align:right;font-weight:600;border-bottom:2px solid #E5E7EB">THÀNH TIỀN</th>
      </tr>
      ${rows}
      ${order.discount > 0 ? `<tr><td style="padding:8px 0;font-size:14px;color:#22C55E">Giảm giá</td><td style="padding:8px 0;font-size:14px;color:#22C55E;text-align:right">-${formatPrice(order.discount)}</td></tr>` : ''}
      <tr>
        <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#111827">Tổng cộng</td>
        <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#5C3D2E;text-align:right">${formatPrice(order.total)}</td>
      </tr>
    </table>`;
}

// ── Email functions ───────────────────────────────────────────────────────────

export async function sendOrderConfirmation(order: AdminOrder) {
  if (!USE_EMAIL || !order.customerEmail) return;
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827">Đặt hàng thành công! 🎉</h2>
    <p style="margin:0 0 24px;color:#6B7280;font-size:15px">Cảm ơn bạn đã tin tưởng Lemini, ${order.customerName}.</p>

    <div style="background:#FDF8F5;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:13px;color:#6B7280">Mã đơn hàng</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#5C3D2E">#${order.code}</p>
    </div>

    ${itemsTable(order)}

    <div style="background:#F9FAFB;border-radius:8px;padding:16px 20px;margin-top:24px">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151">ĐỊA CHỈ GIAO HÀNG</p>
      <p style="margin:0;font-size:14px;color:#6B7280">${order.customerName} · ${order.customerPhone}</p>
      <p style="margin:4px 0 0;font-size:14px;color:#6B7280">${order.address}</p>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#6B7280">
      Chúng tôi sẽ liên hệ xác nhận đơn hàng trong vòng <strong>24 giờ</strong>.
      Theo dõi trạng thái đơn hàng tại trang <strong>Tài khoản → Đơn hàng</strong>.
    </p>`;

  await resend!.emails.send({
    from: FROM,
    to: order.customerEmail,
    subject: `Lemini - Xác nhận đơn hàng #${order.code}`,
    html: baseLayout(`Xác nhận đơn hàng #${order.code}`, body),
  });
}

export async function sendOrderStatusUpdate(order: AdminOrder) {
  if (!USE_EMAIL || !order.customerEmail) return;
  const status = STATUS_LABEL[order.status] ?? order.status;
  const color = STATUS_COLOR[order.status] ?? '#6B7280';

  const extra: Record<string, string> = {
    shipping: '<p style="margin:16px 0 0;font-size:14px;color:#6B7280">Đơn hàng đang trên đường đến bạn. Chúng tôi sẽ thông báo khi giao thành công.</p>',
    completed: '<p style="margin:16px 0 0;font-size:14px;color:#6B7280">Cảm ơn bạn đã mua hàng tại Lemini! Hãy để lại đánh giá sản phẩm để giúp chúng tôi phục vụ bạn tốt hơn. ⭐</p>',
    cancelled: '<p style="margin:16px 0 0;font-size:14px;color:#6B7280">Đơn hàng của bạn đã được hủy. Nếu bạn có thắc mắc, vui lòng liên hệ chúng tôi.</p>',
  };

  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827">Cập nhật đơn hàng</h2>
    <p style="margin:0 0 24px;color:#6B7280;font-size:15px">Đơn hàng <strong>#${order.code}</strong> của bạn đã được cập nhật.</p>

    <div style="background:#F9FAFB;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px">
      <p style="margin:0;font-size:13px;color:#6B7280">Trạng thái hiện tại</p>
      <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:${color}">${status}</p>
    </div>

    ${order.trackingNumber ? `<div style="background:#EFF6FF;border-radius:8px;padding:16px 20px;margin-bottom:16px">
      <p style="margin:0;font-size:13px;color:#6B7280">Mã vận đơn (${order.carrier ?? ''})</p>
      <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1D4ED8">${order.trackingNumber}</p>
    </div>` : ''}

    ${extra[order.status] ?? ''}`;

  await resend!.emails.send({
    from: FROM,
    to: order.customerEmail,
    subject: `Lemini - Đơn hàng #${order.code}: ${status}`,
    html: baseLayout(`Cập nhật đơn hàng #${order.code}`, body),
  });
}

export async function sendNewOrderAlert(order: AdminOrder) {
  if (!USE_EMAIL || !ADMIN_EMAIL) return;
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827">Đơn hàng mới! 🛍️</h2>
    <p style="margin:0 0 24px;color:#6B7280;font-size:15px">Vừa có đơn hàng mới cần xử lý.</p>

    <div style="background:#FDF8F5;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0;font-size:13px;color:#6B7280">Mã đơn hàng</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#5C3D2E">#${order.code}</p>
    </div>

    <div style="background:#F9FAFB;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151">KHÁCH HÀNG</p>
      <p style="margin:0;font-size:14px;color:#374151">${order.customerName}</p>
      <p style="margin:2px 0;font-size:14px;color:#6B7280">${order.customerEmail} · ${order.customerPhone}</p>
      <p style="margin:2px 0;font-size:14px;color:#6B7280">${order.address}</p>
    </div>

    ${itemsTable(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#6B7280;text-align:center">
      Vào <strong>Admin Dashboard</strong> để xử lý đơn hàng này.
    </p>`;

  await resend!.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[Lemini] Đơn hàng mới #${order.code} - ${formatPrice(order.total)}`,
    html: baseLayout(`Đơn hàng mới #${order.code}`, body),
  });
}

export async function sendLowStockAlert(product: { name: string; stock: number; id: string }) {
  if (!USE_EMAIL || !ADMIN_EMAIL) return;
  const body = `
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827">⚠️ Cảnh báo hàng sắp hết</h2>
    <p style="margin:0 0 24px;color:#6B7280;font-size:15px">Sản phẩm sau đây sắp hết hàng, cần bổ sung kho.</p>

    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:20px;text-align:center">
      <p style="margin:0;font-size:16px;font-weight:600;color:#991B1B">${product.name}</p>
      <p style="margin:8px 0 0;font-size:28px;font-weight:700;color:#EF4444">${product.stock} sản phẩm còn lại</p>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#6B7280;text-align:center">
      Vào <strong>Admin → Kho hàng</strong> để cập nhật số lượng.
    </p>`;

  await resend!.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[Lemini] Sắp hết hàng: ${product.name} (còn ${product.stock})`,
    html: baseLayout('Cảnh báo hàng sắp hết', body),
  });
}
