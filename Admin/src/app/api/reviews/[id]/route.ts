import { updateReview, deleteReview } from '@/lib/reviewStore';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return Response.json({}, { headers: CORS });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const review = await updateReview(id, body);
  if (!review) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(review, { headers: CORS });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteReview(id);
  return Response.json({ ok: true }, { headers: CORS });
}
