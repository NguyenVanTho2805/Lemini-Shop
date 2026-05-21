'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  joinedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  authModalOpen: boolean;
  authModalView: 'login' | 'register' | 'forgot';
  openAuthModal: (view?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginWithOAuth: (provider: 'google' | 'facebook') => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(sbUser: SupabaseUser): Promise<User> {
  const { data } = await supabase.from('profiles').select('*').eq('id', sbUser.id).maybeSingle();
  return {
    id: sbUser.id,
    email: sbUser.email ?? '',
    name: (data?.name as string) || sbUser.email?.split('@')[0] || 'Người dùng',
    phone: (data?.phone as string) || undefined,
    address: (data?.address as string) || undefined,
    avatar: (data?.avatar as string) || undefined,
    joinedAt: ((data?.joined_at as string) ?? sbUser.created_at ?? new Date().toISOString()).split('T')[0],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'forgot'>('login');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user).then(setUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user).then(setUser);
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuthModal = (view: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: 'Email hoặc mật khẩu không đúng.' };
    setAuthModalOpen(false);
    return { ok: true };
  };

  const loginWithOAuth = async (provider: 'google' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider === 'facebook' ? 'facebook' : 'google',
      options: { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : '/' },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        return { ok: false, error: 'Email này đã được đăng ký.' };
      }
      return { ok: false, error: error.message };
    }
    if (data.user && !data.session) {
      return { ok: false, error: 'Kiểm tra email để xác nhận tài khoản trước khi đăng nhập.' };
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        name,
        joined_at: new Date().toISOString(),
      });
    }
    setAuthModalOpen(false);
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    supabase.auth.signOut();
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: updated.name,
      phone: updated.phone ?? null,
      address: updated.address ?? null,
      avatar: updated.avatar ?? null,
    });
  };

  const changePassword = async (current: string, next: string) => {
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user!.email,
      password: current,
    });
    if (verifyErr) return { ok: false, error: 'Mật khẩu hiện tại không đúng.' };
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  return (
    <AuthContext.Provider value={{
      user, isLoggedIn: !!user,
      authModalOpen, authModalView,
      openAuthModal, closeAuthModal,
      login, loginWithOAuth, register, logout, updateProfile, changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
