import fs from 'fs';
import path from 'path';
import { supabase, USE_SUPABASE } from './supabase';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface AdminReview {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  author: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'reviews.json');

function readJSON(): AdminReview[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch { return []; }
}
function writeJSON(reviews: AdminReview[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(reviews, null, 2), 'utf-8');
}

function fromRow(row: Record<string, unknown>): AdminReview {
  return { ...(row.data as AdminReview), id: row.id as string };
}

// ---- Public async API ----
export async function getReviews(productId?: string, status?: string): Promise<AdminReview[]> {
  if (USE_SUPABASE) {
    let q = supabase!.from('reviews').select('*').order('created_at', { ascending: false });
    if (productId) q = q.eq('product_id', productId);
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  let reviews = readJSON();
  if (productId) reviews = reviews.filter(r => r.productId === productId);
  if (status) reviews = reviews.filter(r => r.status === status);
  return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReview(review: AdminReview): Promise<AdminReview> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('reviews').insert({
      id: review.id, product_id: review.productId,
      product_slug: review.productSlug, author: review.author,
      rating: review.rating, status: review.status, data: review,
    }).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const reviews = readJSON();
  reviews.unshift(review);
  writeJSON(reviews);
  return review;
}

export async function updateReview(id: string, updates: Partial<AdminReview>): Promise<AdminReview | null> {
  if (USE_SUPABASE) {
    const { data: existing } = await supabase!.from('reviews').select('*').eq('id', id).maybeSingle();
    if (!existing) return null;
    const merged = { ...fromRow(existing), ...updates, id };
    const { data, error } = await supabase!.from('reviews').update({ status: merged.status, data: merged }).eq('id', id).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const reviews = readJSON();
  const idx = reviews.findIndex(r => r.id === id);
  if (idx === -1) return null;
  reviews[idx] = { ...reviews[idx], ...updates };
  writeJSON(reviews);
  return reviews[idx];
}

export async function deleteReview(id: string): Promise<void> {
  if (USE_SUPABASE) {
    await supabase!.from('reviews').delete().eq('id', id);
    return;
  }
  writeJSON(readJSON().filter(r => r.id !== id));
}

// Backward compat
export const readReviews = () => readJSON();
export const writeReviews = (r: AdminReview[]) => writeJSON(r);
