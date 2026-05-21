import { getOrders, createOrder, type AdminOrder } from '@/lib/orderStore';
import { getPromotionByCode, updatePromotion } from '@/lib/promotionStore';
import { sendOrderConfirmation, sendNewOrderAlert } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') ?? undefined;
  return Response.json(await getOrders(email));
}

export async function POST(request: Request) {
  const body = await request.json();
  const now = new Date().toISOString();
  const newOrder: AdminOrder = {
    id: `o_${Date.now()}`,
    code: `LM-${Date.now().toString().slice(-8)}`,
    customerName: body.customerName ?? '',
    customerEmail: body.customerEmail ?? '',
    customerPhone: body.customerPhone ?? '',
    address: body.address ?? '',
    items: body.items ?? [],
    total: body.total ?? 0,
    shippingFee: body.shippingFee ?? 0,
    discount: body.discount ?? 0,
    voucherCode: body.voucherCode,
    paymentMethod: body.paymentMethod,
    status: 'pending',
    note: body.note,
    createdAt: now,
    updatedAt: now,
  };

  const order = await createOrder(newOrder);

  // Gửi email (fire-and-forget, không block response)
  sendOrderConfirmation(order).catch(console.error);
  sendNewOrderAlert(order).catch(console.error);

  if (body.voucherCode) {
    const promo = await getPromotionByCode(String(body.voucherCode));
    if (promo) await updatePromotion(promo.id, { usageCount: promo.usageCount + 1 });
  }

  return Response.json(order, { status: 201 });
}
