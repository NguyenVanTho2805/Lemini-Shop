import { getSettings, saveSettings } from '@/lib/settingsStore';

export async function GET() {
  return Response.json(await getSettings());
}

export async function PUT(request: Request) {
  const body = await request.json();
  const current = await getSettings();
  const updated = await saveSettings({ ...current, ...body });
  return Response.json(updated);
}
