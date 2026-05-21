import { getProducts, createProduct } from '@/lib/productStore';
import type { AdminProduct } from '@/types/product';

export async function GET() {
  const products = await getProducts();
  return Response.json(products);
}

export async function POST(request: Request) {
  const body = (await request.json()) as AdminProduct;
  const product = await createProduct(body);
  return Response.json(product, { status: 201 });
}
