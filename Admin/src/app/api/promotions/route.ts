import { getPromotions, getPromotionByCode, createPromotion, type AdminPromotion } from '@/lib/promotionStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const promo = await getPromotionByCode(code);
    if (!promo) return Response.json({ error: 'Mã giảm giá không hợp lệ hoặc đã ngưng hoạt động' }, { status: 404 });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return Response.json({ error: 'Mã giảm giá đã hết hạn' }, { status: 400 });
    if (promo.usageCount >= promo.usageLimit) return Response.json({ error: 'Mã giảm giá đã hết lượt sử dụng' }, { status: 400 });
    return Response.json(promo);
  }

  return Response.json(await getPromotions());
}

export async function POST(request: Request) {
  const body = await request.json();
  const newPromo: AdminPromotion = {
    id: `v_${Date.now()}`,
    code: String(body.code ?? '').toUpperCase(),
    description: body.description ?? '',
    type: body.type ?? 'percent',
    value: Number(body.value ?? 0),
    minOrder: Number(body.minOrder ?? 0),
    maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : undefined,
    usageLimit: Number(body.usageLimit ?? 100),
    usageCount: 0,
    status: body.status ?? 'active',
    expiresAt: body.expiresAt ?? '',
    createdAt: new Date().toISOString().split('T')[0],
  };
  return Response.json(await createPromotion(newPromo), { status: 201 });
}
