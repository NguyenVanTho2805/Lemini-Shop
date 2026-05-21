import fs from 'fs';
import path from 'path';
import { supabase, USE_SUPABASE } from './supabase';

export interface InventoryLogEntry {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  delta: number;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'inventory-log.json');

function readJSON(): InventoryLogEntry[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch { return []; }
}
function writeJSON(entries: InventoryLogEntry[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(entries, null, 2), 'utf-8');
}
function fromRow(row: Record<string, unknown>): InventoryLogEntry {
  return { ...(row.data as InventoryLogEntry), id: row.id as string };
}

// ---- Public async API ----
export async function getLog(limit = 50): Promise<InventoryLogEntry[]> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('inventory_log').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map(fromRow);
  }
  return [...readJSON()].reverse().slice(0, limit);
}

export async function appendLog(entry: Omit<InventoryLogEntry, 'id' | 'createdAt'>): Promise<InventoryLogEntry> {
  const newEntry: InventoryLogEntry = {
    id: `log_${Date.now()}`,
    ...entry,
    createdAt: new Date().toISOString(),
  };

  if (USE_SUPABASE) {
    const { data, error } = await supabase!.from('inventory_log').insert({
      id: newEntry.id, product_id: newEntry.productId,
      delta: newEntry.delta, data: newEntry,
    }).select().single();
    if (error) throw error;
    return fromRow(data);
  }

  const entries = readJSON();
  entries.push(newEntry);
  if (entries.length > 200) entries.splice(0, entries.length - 200);
  writeJSON(entries);
  return newEntry;
}

// Backward compat
export const readLog = () => readJSON();
export const writeLog = (e: InventoryLogEntry[]) => writeJSON(e);
