import fs from 'fs';
import path from 'path';
import { supabase, USE_SUPABASE } from './supabase';

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';

export interface AdminOrder {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  items: { productId: string; name: string; image: string; price: number; quantity: number }[];
  total: number;
  shippingFee: number;
  discount: number;
  voucherCode?: string;
  paymentMethod?: 'cod' | 'bank' | 'momo' | 'vnpay';
  carrier?: string;
  trackingNumber?: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'orders.json');

function readJSON(): AdminOrder[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch { return []; }
}
function writeJSON(orders: AdminOrder[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

function fromRow(row: Record<string, unknown>): AdminOrder {
  return { ...(row.data as AdminOrder), id: row.id as string };
}

// ---- Public async API ----
export async function getOrders(email?: string): Promise<AdminOrder[]> {
  if (USE_SUPABASE) {
    let q = supabase!.from('orders').select('*').order('created_at', { ascending: false });
    if (email) q = q.eq('customer_email', email);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  let orders = readJSON();
  if (email) orders = orders.filter(o => o.customerEmail === email);
  return orders;
}

export async function getOrderById(id: string): Promise<AdminOrder | null> {
  if (USE_SUPABASE) {
    const { data } = await supabase!.from('orders').select('*').eq('id', id).maybeSingle();
    return data ? fromRow(data) : null;
  }
  return readJSON().find(o => o.id === id) ?? null;
}

export async function createOrder(order: AdminOrder): Promise<AdminOrder> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('orders').insert({
      id: order.id, code: order.code,
      customer_name: order.customerName, customer_email: order.customerEmail,
      status: order.status, total: order.total,
      voucher_code: order.voucherCode ?? null, data: order,
    }).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const orders = readJSON();
  orders.unshift(order);
  writeJSON(orders);
  return order;
}

export async function updateOrder(id: string, updates: Partial<AdminOrder>): Promise<AdminOrder | null> {
  if (USE_SUPABASE) {
    const existing = await getOrderById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    const { data, error } = await supabase!.from('orders').update({
      status: merged.status, data: merged, updated_at: merged.updatedAt,
    }).eq('id', id).select().single();
    if (error) throw error;
    return fromRow(data);
  }
  const orders = readJSON();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...updates, updatedAt: new Date().toISOString() };
  writeJSON(orders);
  return orders[idx];
}

export async function deleteOrder(id: string): Promise<void> {
  if (USE_SUPABASE) {
    await supabase!.from('orders').delete().eq('id', id);
    return;
  }
  writeJSON(readJSON().filter(o => o.id !== id));
}

// Backward compat
export const readOrders = () => readJSON();
export const writeOrders = (o: AdminOrder[]) => writeJSON(o);
