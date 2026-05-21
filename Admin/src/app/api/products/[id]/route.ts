import { getProductById, updateProduct, deleteProduct } from '@/lib/productStore';
import type { AdminProduct } from '@/types/product';
import { sendLowStockAlert } from '@/lib/email';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(product);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Partial<AdminProduct>;
  const product = await updateProduct(id, body);
  if (!product) return Response.json({ error: 'Not found' }, { status: 404 });
  // Cảnh báo hàng sắp hết (dưới 5)
  if (product.stock < 5) {
    sendLowStockAlert({ id: product.id, name: product.name, stock: product.stock }).catch(console.error);
  }
  return Response.json(product);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteProduct(id);
  if (!ok) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ success: true });
}
