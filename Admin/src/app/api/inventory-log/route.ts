import { getLog, appendLog } from '@/lib/inventoryLogStore';

export async function GET() {
  return Response.json(await getLog(50));
}

export async function POST(request: Request) {
  const body = await request.json();
  const entry = await appendLog({
    productId: body.productId,
    productName: body.productName,
    previousStock: body.previousStock,
    newStock: body.newStock,
    delta: body.newStock - body.previousStock,
  });
  return Response.json(entry, { status: 201 });
}
