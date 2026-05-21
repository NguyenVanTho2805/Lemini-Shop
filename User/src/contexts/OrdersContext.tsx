'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { type Order } from '@/lib/orders';
import { useAuth } from './AuthContext';

const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:3001';
const STORAGE_KEY = 'lemini_orders';

export interface PlaceOrderPayload {
  customerName: string;
  customerPhone: string;
  address: string;
  items: { productId: string; name: string; image: string; price: number; quantity: number }[];
  total: number;
  shippingFee: number;
  discount: number;
  voucherCode?: string;
  note?: string;
  paymentMethod?: 'cod' | 'bank' | 'momo' | 'vnpay';
}

interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  placeOrder: (payload: PlaceOrderPayload) => Promise<Order>;
  cancelOrder: (id: string) => Promise<{ ok: boolean; error?: string }>;
  refetch: () => void;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

function toUserOrder(a: Record<string, unknown>): Order {
  return {
    id: String(a.id),
    code: String(a.code),
    date: String(a.createdAt ?? a.date ?? ''),
    status: (a.status as Order['status']) ?? 'pending',
    items: (a.items as Order['items']) ?? [],
    total: Number(a.total),
    address: String(a.address),
    shippingFee: Number(a.shippingFee ?? 0),
  };
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFromAdmin = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/api/orders?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error();
      const data: Record<string, unknown>[] = await res.json();
      const mapped = data.map(toUserOrder);
      setOrders(mapped);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
    } catch {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setOrders(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      fetchFromAdmin(user.email);
    } else {
      setOrders([]);
    }
  }, [user?.email, fetchFromAdmin]);

  const placeOrder = useCallback(async (payload: PlaceOrderPayload): Promise<Order> => {
    const res = await fetch(`${ADMIN_API}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, customerEmail: user?.email ?? '' }),
    });
    if (!res.ok) throw new Error('Không thể đặt hàng');
    const created: Record<string, unknown> = await res.json();
    const order = toUserOrder(created);
    setOrders(prev => {
      const next = [order, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return order;
  }, [user?.email]);

  const cancelOrder = useCallback(async (id: string): Promise<{ ok: boolean; error?: string }> => {
    let apiOk = true;
    try {
      const res = await fetch(`${ADMIN_API}/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) apiOk = false;
    } catch {
      apiOk = false;
    }
    setOrders(prev => {
      const next = prev.map(o => o.id === id && o.status === 'pending' ? { ...o, status: 'cancelled' as const } : o);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return apiOk
      ? { ok: true }
      : { ok: false, error: 'Đơn hàng đã hủy cục bộ. Sẽ đồng bộ khi kết nối lại.' };
  }, []);

  const refetch = useCallback(() => {
    if (user?.email) fetchFromAdmin(user.email);
  }, [user?.email, fetchFromAdmin]);

  return (
    <OrdersContext.Provider value={{ orders, loading, placeOrder, cancelOrder, refetch }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside OrdersProvider');
  return ctx;
}
