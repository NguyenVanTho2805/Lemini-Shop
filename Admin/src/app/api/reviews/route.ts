import { getReviews, createReview, type AdminReview } from '@/lib/reviewStore';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return Response.json({}, { headers: CORS });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  return Response.json(await getReviews(productId, status), { headers: CORS });
}

export async function POST(request: Request) {
  const body = await request.json();
  const review: AdminReview = {
    id: `rev_${Date.now()}`,
    productId: String(body.productId ?? ''),
    productSlug: String(body.productSlug ?? ''),
    productName: String(body.productName ?? ''),
    author: String(body.author ?? 'Ẩn danh'),
    rating: Math.min(5, Math.max(1, Number(body.rating ?? 5))),
    content: String(body.content ?? ''),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  return Response.json(await createReview(review), { status: 201, headers: CORS });
}
