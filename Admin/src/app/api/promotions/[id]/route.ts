import { updatePromotion, deletePromotion } from '@/lib/promotionStore';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const promo = await updatePromotion(id, body);
  if (!promo) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(promo);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deletePromotion(id);
  return Response.json({ ok: true });
}
