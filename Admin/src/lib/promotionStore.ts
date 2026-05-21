import fs from 'fs';
import path from 'path';
import { supabase, USE_SUPABASE } from './supabase';

export interface AdminPromotion {
  id: string;
  code: string;
  description: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageLimit: number;
  usageCount: number;
  status: 'active' | 'expired' | 'draft';
  expiresAt: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'promotions.json');

const SEED: AdminPromotion[] = [
  { id: 'v1', code: 'WELCOME10', description: 'Giảm 10% cho đơn từ 200.000đ', type: 'percent', value: 10, minOrder: 200000, maxDiscount: 50000, usageLimit: 100, usageCount: 23, status: 'active', expiresAt: '2027-12-31', createdAt: '2026-01-01' },
  { id: 'v2', code: 'FREESHIP', description: 'Miễn phí vận chuyển (giảm 30.000đ)', type: 'fixed', value: 30000, minOrder: 0, usageLimit: 500, usageCount: 127, status: 'active', expiresAt: '2027-12-31', createdAt: '2026-01-01' },
  { id: 'v3', code: 'LEMINI20', description: 'Giảm 20% tối đa 100.000đ', type: 'percent', value: 20, minOrder: 300000, maxDiscount: 100000, usageLimit: 50, usageCount: 12, status: 'active', expiresAt: '2027-12-31', createdAt: '2026-01-01' },
];

function readJSON(): AdminPromotion[] {
  try {
    if (!fs.existsSync(FILE)) return SEED;
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch { return SEED; }
}
function writeJSON(p: AdminPromotion[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(p, null, 2), 'utf-8');
}

function fromRow(row: Record<string, unknown>): AdminPromotion {
  return { ...(row.data as AdminPromotion), id: row.id as string };
}

// ---- Public async API ----
export async function getPromotions(): Promise<AdminPromotion[]> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('promotions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  return readJSON();
}

export async function getPromotionByCode(code: string): Promise<AdminPromotion | null> {
  if (USE_SUPABASE) {
    const { data } = await supabase!.from('promotions').select('*').eq('code', code.toUpperCase()).eq('status', 'active').maybeSingle();
    return data ? fromRow(data) : null;
  }
  return readJSON().find(p => p.code === code.toUpperCase() && p.status === 'active') ?? null;
}

export async function createPromotion(promo: AdminPromotion): Promise<AdminPromotion> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('promotions').insert({
      id: promo.id, code: promo.code, status: promo.status,
      usage_count: promo.usageCount, usage_limit: promo.usageLimit,
      expires_at: promo.expiresAt || null, data: promo,
    }).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const promos = readJSON();
  promos.unshift(promo);
  writeJSON(promos);
  return promo;
}

export async function updatePromotion(id: string, updates: Partial<AdminPromotion>): Promise<AdminPromotion | null> {
  if (USE_SUPABASE) {
    const { data: existing } = await supabase!.from('promotions').select('*').eq('id', id).maybeSingle();
    if (!existing) return null;
    const merged = { ...fromRow(existing), ...updates, id };
    const { data, error } = await supabase!.from('promotions').update({
      status: merged.status, usage_count: merged.usageCount,
      usage_limit: merged.usageLimit, data: merged,
    }).eq('id', id).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const promos = readJSON();
  const idx = promos.findIndex(p => p.id === id);
  if (idx === -1) return null;
  promos[idx] = { ...promos[idx], ...updates };
  writeJSON(promos);
  return promos[idx];
}

export async function deletePromotion(id: string): Promise<void> {
  if (USE_SUPABASE) {
    await supabase!.from('promotions').delete().eq('id', id);
    return;
  }
  writeJSON(readJSON().filter(p => p.id !== id));
}

// Backward compat
export const readPromotions = () => readJSON();
export const writePromotions = (p: AdminPromotion[]) => writeJSON(p);
