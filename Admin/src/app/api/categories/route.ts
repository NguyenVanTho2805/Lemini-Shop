import { getCategories, createCategory, type AdminCategory } from '@/lib/categoryStore';

export async function GET() {
  return Response.json(await getCategories());
}

export async function POST(request: Request) {
  const body = await request.json();
  const cats = await getCategories();
  const newCat: AdminCategory = {
    id: `c_${Date.now()}`,
    name: body.name ?? '',
    slug: body.slug ?? '',
    icon: body.icon ?? '📦',
    description: body.description ?? '',
    order: cats.length + 1,
  };
  const cat = await createCategory(newCat);
  return Response.json(cat, { status: 201 });
}
