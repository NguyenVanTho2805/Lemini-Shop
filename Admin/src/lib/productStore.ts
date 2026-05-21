import fs from 'fs';
import path from 'path';
import { supabase, USE_SUPABASE } from './supabase';
import type { AdminProduct } from '@/types/product';

// ---- JSON fallback ----
const DATA_PATH = path.join(process.cwd(), 'data', 'products.json');

const DEFAULT_PRODUCTS: AdminProduct[] = [
  { id: '1', name: 'Túi thêu hoa cúc vàng', slug: 'tui-theu-hoa-cuc-vang', description: 'Chiếc túi xách được thêu tay tỉ mỉ với họa tiết hoa cúc vàng rực rỡ.', category: 'tui-theu', price: 320000, originalPrice: 380000, image: 'https://picsum.photos/600/800?random=10', images: ['https://picsum.photos/600/800?random=10', 'https://picsum.photos/600/800?random=11'], badge: 'sale', colors: ['kem', 'xanh nhạt', 'hồng'], sizes: ['S', 'M'], stock: 45, sold: 128, status: 'active', featured: true, details: ['Chất liệu: vải canvas cao cấp', 'Thêu tay 100% thủ công'], care: ['Giặt tay nhẹ nhàng với nước lạnh', 'Không dùng máy giặt'], metaDescription: 'Túi thêu hoa cúc vàng handmade từ Lemini', createdAt: '2025-01-10T07:00:00.000Z', updatedAt: '2025-05-10T07:00:00.000Z' },
  { id: '2', name: 'Tranh thêu phong cảnh Hội An', slug: 'tranh-theu-phong-canh-hoi-an', description: 'Tác phẩm tranh thêu tay mô tả vẻ đẹp cổ kính của phố cổ Hội An.', category: 'tranh-theu', price: 850000, image: 'https://picsum.photos/600/800?random=20', images: ['https://picsum.photos/600/800?random=20'], colors: ['nâu cổ', 'trắng ngà'], sizes: ['30×40cm', '40×60cm'], stock: 12, sold: 67, status: 'active', featured: true, details: ['Chất liệu: vải lụa tự nhiên', 'Chỉ thêu: tơ tằm cao cấp'], care: ['Tránh ánh nắng trực tiếp'], metaDescription: 'Tranh thêu phong cảnh Hội An handmade', createdAt: '2025-01-15T07:00:00.000Z', updatedAt: '2025-05-12T07:00:00.000Z' },
  { id: '3', name: 'Bộ kit DIY thêu tranh sen', slug: 'bo-kit-diy-theu-tranh-sen', description: 'Bộ nguyên liệu DIY đầy đủ để tự tay thêu bức tranh hoa sen.', category: 'bo-kit-diy', price: 280000, originalPrice: 320000, image: 'https://picsum.photos/600/800?random=30', images: ['https://picsum.photos/600/800?random=30'], badge: 'sale', colors: ['đỏ', 'hồng', 'trắng'], sizes: ['20×20cm'], stock: 89, sold: 243, status: 'active', featured: false, details: ['Bao gồm đầy đủ nguyên vật liệu', 'Phù hợp người mới bắt đầu'], care: ['Bảo quản chỉ thêu nơi khô ráo'], metaDescription: 'Bộ kit DIY thêu tranh hoa sen', createdAt: '2025-02-01T07:00:00.000Z', updatedAt: '2025-05-08T07:00:00.000Z' },
  { id: '5', name: 'Cài tóc thêu hoa mai', slug: 'cai-toc-theu-hoa-mai', description: 'Cài tóc handmade với họa tiết hoa mai thêu tay.', category: 'phu-kien', price: 75000, image: 'https://picsum.photos/600/800?random=50', images: ['https://picsum.photos/600/800?random=50'], colors: ['vàng', 'bạc', 'đồng'], sizes: ['One size'], stock: 234, sold: 489, status: 'active', featured: true, details: ['Chất liệu: kim loại mạ vàng/bạc/đồng'], care: ['Lau khô sau khi dùng'], metaDescription: 'Cài tóc thêu hoa mai handmade', createdAt: '2025-03-01T07:00:00.000Z', updatedAt: '2025-05-14T07:00:00.000Z' },
];

function readJSON(): AdminProduct[] {
  try {
    if (!fs.existsSync(DATA_PATH)) { writeJSON(DEFAULT_PRODUCTS); return DEFAULT_PRODUCTS; }
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    return Array.isArray(parsed) ? parsed : DEFAULT_PRODUCTS;
  } catch { return DEFAULT_PRODUCTS; }
}

function writeJSON(products: AdminProduct[]): void {
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2), 'utf-8');
  } catch (e) { console.error('Failed to write products.json', e); }
}

// ---- Supabase row mapping ----
function toRow(p: AdminProduct) {
  return { id: p.id, name: p.name, slug: p.slug, category: p.category ?? null, price: p.price, stock: p.stock, sold: p.sold ?? 0, status: p.status, featured: p.featured ?? false, data: p };
}
function fromRow(row: Record<string, unknown>): AdminProduct {
  return { ...(row.data as AdminProduct), id: row.id as string };
}

// ---- Public async API ----
export async function getProducts(): Promise<AdminProduct[]> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  return readJSON();
}

export async function getProductById(id: string): Promise<AdminProduct | null> {
  if (USE_SUPABASE) {
    const { data } = await supabase!.from('products').select('*').eq('id', id).maybeSingle();
    return data ? fromRow(data) : null;
  }
  return readJSON().find(p => p.id === id) ?? null;
}

export async function createProduct(product: AdminProduct): Promise<AdminProduct> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('products').insert(toRow(product)).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const products = readJSON();
  products.unshift(product);
  writeJSON(products);
  return product;
}

export async function updateProduct(id: string, updates: Partial<AdminProduct>): Promise<AdminProduct | null> {
  if (USE_SUPABASE) {
    const existing = await getProductById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    const { data, error } = await supabase!.from('products').update(toRow(merged)).eq('id', id).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const products = readJSON();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates, id, updatedAt: new Date().toISOString() };
  writeJSON(products);
  return products[idx];
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (USE_SUPABASE) {
    const { error } = await supabase!.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  const products = readJSON();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  writeJSON(filtered);
  return true;
}

// Backward compat aliases (sync wrappers kept for non-critical use)
export const readProducts = () => readJSON();
export const writeProducts = (p: AdminProduct[]) => writeJSON(p);
