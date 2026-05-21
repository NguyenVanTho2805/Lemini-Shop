import fs from 'fs';
import path from 'path';
import { supabase, USE_SUPABASE } from './supabase';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  order: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'categories.json');

const SEED: AdminCategory[] = [
  { id: 'c1', name: 'Túi thêu', slug: 'tui-theu', icon: '👜', description: 'Túi xách, túi tote, túi đeo vai thêu tay', order: 1 },
  { id: 'c2', name: 'Tranh thêu', slug: 'tranh-theu', icon: '🖼️', description: 'Tranh phong cảnh, hoa lá, chân dung thêu tay', order: 2 },
  { id: 'c3', name: 'Bộ kit DIY', slug: 'bo-kit-diy', icon: '🧵', description: 'Bộ nguyên liệu tự thêu tại nhà', order: 3 },
  { id: 'c4', name: 'Phụ kiện', slug: 'phu-kien', icon: '✨', description: 'Cài tóc, khăn, vòng tay thêu', order: 4 },
];

function readJSON(): AdminCategory[] {
  try {
    if (!fs.existsSync(FILE)) return SEED;
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch { return SEED; }
}
function writeJSON(cats: AdminCategory[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(cats, null, 2), 'utf-8');
}

function fromRow(row: Record<string, unknown>): AdminCategory {
  return { ...(row.data as AdminCategory), id: row.id as string };
}

// ---- Public async API ----
export async function getCategories(): Promise<AdminCategory[]> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('categories').select('*').order('sort_order');
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  return readJSON();
}

export async function createCategory(cat: AdminCategory): Promise<AdminCategory> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('categories').insert({ id: cat.id, name: cat.name, slug: cat.slug, sort_order: cat.order, data: cat }).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const cats = readJSON();
  cats.push(cat);
  writeJSON(cats);
  return cat;
}

export async function updateCategory(id: string, updates: Partial<AdminCategory>): Promise<AdminCategory | null> {
  if (USE_SUPABASE) {
    const { data: existing } = await supabase!.from('categories').select('*').eq('id', id).maybeSingle();
    if (!existing) return null;
    const merged = { ...fromRow(existing), ...updates, id };
    const { data, error } = await supabase!.from('categories').update({ name: merged.name, slug: merged.slug, sort_order: merged.order, data: merged }).eq('id', id).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const cats = readJSON();
  const idx = cats.findIndex(c => c.id === id);
  if (idx === -1) return null;
  cats[idx] = { ...cats[idx], ...updates };
  writeJSON(cats);
  return cats[idx];
}

export async function deleteCategory(id: string): Promise<void> {
  if (USE_SUPABASE) {
    await supabase!.from('categories').delete().eq('id', id);
    return;
  }
  writeJSON(readJSON().filter(c => c.id !== id));
}

// Backward compat
export const readCategories = () => readJSON();
export const writeCategories = (c: AdminCategory[]) => writeJSON(c);
