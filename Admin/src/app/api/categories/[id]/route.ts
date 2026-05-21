import { updateCategory, deleteCategory } from '@/lib/categoryStore';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const cat = await updateCategory(id, body);
  if (!cat) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(cat);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCategory(id);
  return Response.json({ ok: true });
}
