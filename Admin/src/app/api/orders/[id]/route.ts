import { getOrderById, updateOrder, deleteOrder } from '@/lib/orderStore';
import { sendOrderStatusUpdate } from '@/lib/email';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(order);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const prev = await getOrderById(id);
  const order = await updateOrder(id, body);
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 });
  // Gửi email khi status thay đổi
  if (body.status && prev?.status !== body.status) {
    sendOrderStatusUpdate(order).catch(console.error);
  }
  return Response.json(order);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteOrder(id);
  return Response.json({ ok: true });
}
