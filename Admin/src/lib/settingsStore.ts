import fs from 'fs';
import path from 'path';
import { supabase, USE_SUPABASE } from './supabase';

export interface AppSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  bankAccount: string;
  bankOwner: string;
  shippingFee: number;
  freeShippingThreshold: number;
}

const DEFAULT: AppSettings = {
  storeName: 'Lemini',
  storeEmail: 'hello@lemini.com',
  storePhone: '0901 234 567',
  storeAddress: '12 Lê Lợi, Q.1, TP.HCM',
  bankAccount: '0123456789 - Vietcombank',
  bankOwner: 'NGUYEN THI MIRA',
  shippingFee: 30000,
  freeShippingThreshold: 500000,
};

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'settings.json');

function readJSON(): AppSettings {
  try {
    if (!fs.existsSync(FILE)) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(fs.readFileSync(FILE, 'utf-8')) };
  } catch { return { ...DEFAULT }; }
}
function writeJSON(s: AppSettings): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(s, null, 2), 'utf-8');
}

// ---- Public async API ----
export async function getSettings(): Promise<AppSettings> {
  if (USE_SUPABASE) {
    const { data } = await supabase!.from('settings').select('value').eq('key', 'app').maybeSingle();
    return data ? { ...DEFAULT, ...(data.value as AppSettings) } : { ...DEFAULT };
  }
  return readJSON();
}

export async function saveSettings(s: AppSettings): Promise<AppSettings> {
  if (USE_SUPABASE) {
    await supabase!.from('settings').upsert({ key: 'app', value: s });
    return s;
  }
  writeJSON(s);
  return s;
}

// Backward compat
export const readSettings = () => readJSON();
export const writeSettings = (s: AppSettings) => writeJSON(s);
