'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus, ShoppingBag, Truck, Tag, CheckCircle, ChevronLeft, Gift, Package, Heart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrdersContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice } from '@/lib/utils';

const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API ?? 'http://localhost:3001';
const SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

type Step = 'cart' | 'checkout' | 'success';

interface Voucher {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  description: string;
}

export default function CartDrawer() {
  const { items, removeFromCart, updateQty, subtotal, cartCount, clearCart, cartOpen: open, closeCart: onClose } = useCart();
  const { user, openAuthModal } = useAuth();
  const { placeOrder } = useOrders();
  const { toggle: wishlistToggle } = useWishlist();
  const { showToast } = useToast();

  const handleSaveForLater = (item: typeof items[0]) => {
    wishlistToggle(item.product);
    removeFromCart(item.product.id);
    showToast(`Đã lưu "${item.product.name}" vào yêu thích`, 'info');
  };

  const [step, setStep] = useState<Step>('cart');
  const [giftWrap, setGiftWrap] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'momo' | 'vnpay'>('cod');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [lastOrderCode, setLastOrderCode] = useState('');

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (user && step === 'checkout') {
      setForm(f => ({
        name: f.name || user.name || '',
        phone: f.phone || user.phone || '',
        address: f.address || user.address || '',
        note: f.note,
      }));
    }
  }, [user, step]);

  useEffect(() => {
    if (!open) { setStep('cart'); setVoucher(null); setVoucherCode(''); setVoucherError(''); setOrderError(''); setPaymentMethod('cod'); }
  }, [open]);

  const applyVoucher = useCallback(async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    setCheckingVoucher(true);
    setVoucherError('');
    setVoucher(null);
    try {
      const res = await fetch(`${ADMIN_API}/api/promotions`);
      const list: (Voucher & { status: string; usageCount: number; usageLimit: number; expiresAt: string; code: string })[] = await res.json();
      const found = list.find(p => p.code === code);
      if (!found) { setVoucherError('Mã không tồn tại'); return; }
      if (found.status !== 'active') { setVoucherError('Mã đã hết hiệu lực'); return; }
      if (found.usageCount >= found.usageLimit) { setVoucherError('Mã đã hết lượt sử dụng'); return; }
      if (found.expiresAt && new Date(found.expiresAt) < new Date()) { setVoucherError('Mã đã hết hạn'); return; }
      if (subtotal < found.minOrder) { setVoucherError(`Đơn tối thiểu ${formatPrice(found.minOrder)}`); return; }
      setVoucher(found);
    } catch {
      setVoucherError('Không thể kiểm tra mã, thử lại sau');
    } finally {
      setCheckingVoucher(false);
    }
  }, [voucherCode, subtotal]);

  if (!open) return null;

  const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const discount = voucher
    ? voucher.type === 'percent'
      ? Math.min(Math.round(subtotal * voucher.value / 100), voucher.maxDiscount ?? Infinity)
      : voucher.value
    : 0;
  const total = subtotal + shippingFee - discount;
  const freeShippingLeft = Math.max(0, SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, (subtotal / SHIPPING_THRESHOLD) * 100);

  const handleCheckout = () => {
    if (!user) { onClose(); openAuthModal('login'); return; }
    setStep('checkout');
  };

  const handlePlaceOrder = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setOrderError('Vui lòng điền đầy đủ thông tin giao hàng'); return;
    }
    setOrderError('');
    setPlacing(true);
    try {
      const order = await placeOrder({
        customerName: form.name,
        customerPhone: form.phone,
        address: form.address,
        note: form.note,
        items: items.map(i => ({
          productId: i.product.id,
          name: i.product.name,
          image: i.product.image,
          price: i.product.price,
          quantity: i.quantity,
        })),
        total,
        shippingFee,
        discount,
        voucherCode: voucher?.code,
        paymentMethod,
      });

      if (paymentMethod === 'vnpay') {
        const res = await fetch('/api/payment/vnpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, orderCode: order.code, amount: total }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? 'Không thể tạo liên kết VNPay');
        }
        const { paymentUrl } = await res.json() as { paymentUrl: string };
        clearCart();
        window.location.href = paymentUrl;
        return;
      }

      setLastOrderCode(order.code);
      clearCart();
      setStep('success');
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'Đặt hàng thất bại, thử lại sau');
    } finally {
      setPlacing(false);
    }
  };

  return createPortal(
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.3s ease',
      }} />

      {/* Drawer panel */}
      <div style={{
        position: 'relative',
        width: 420,
        maxWidth: '100vw',
        height: '100%',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.15)',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 60,
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 'checkout' && (
              <button onClick={() => setStep('cart')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', color: '#555',
                padding: '4px 8px 4px 0', marginRight: 2,
              }}>
                <ChevronLeft size={20} />
              </button>
            )}
            <ShoppingBag size={18} color="#2E1A4A" />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
              {step === 'cart' ? 'Giỏ hàng' : step === 'checkout' ? 'Thông tin đặt hàng' : 'Đặt hàng thành công'}
            </span>
            {step === 'cart' && cartCount > 0 && (
              <span style={{
                background: '#2E1A4A', color: '#fff',
                fontSize: 11, fontWeight: 700,
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid #e8e8e8', background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#555', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── STEP: CART ── */}
        {step === 'cart' && (
          <>
            {/* Free shipping nudge */}
            {items.length > 0 && (
              <div style={{
                padding: '10px 20px',
                background: freeShippingLeft === 0 ? '#f0fdf4' : '#fafafa',
                borderBottom: '1px solid #f0f0f0',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: freeShippingLeft > 0 ? 7 : 0 }}>
                  <Truck size={13} color={freeShippingLeft === 0 ? '#16a34a' : '#888'} />
                  {freeShippingLeft > 0 ? (
                    <span style={{ fontSize: 12, color: '#555' }}>
                      Mua thêm <strong style={{ color: '#2E1A4A' }}>{formatPrice(freeShippingLeft)}</strong> để được <span style={{ color: '#9B72CF', fontWeight: 600 }}>miễn phí vận chuyển</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                      Bạn được miễn phí vận chuyển!
                    </span>
                  )}
                </div>
                {freeShippingLeft > 0 && (
                  <div style={{ height: 3, background: '#e8e8e8', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${shippingProgress}%`,
                      background: 'linear-gradient(to right, #9B72CF, #2E1A4A)',
                      borderRadius: 999, transition: 'width 0.4s ease',
                    }} />
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: items.length === 0 ? 0 : '8px 0' }}>
              {items.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', minHeight: 320,
                  gap: 12, color: '#bbb', padding: 32,
                }}>
                  <ShoppingBag size={52} strokeWidth={1} color="#ddd" />
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#333', marginTop: 4 }}>Giỏ hàng trống</p>
                  <p style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>Thêm sản phẩm yêu thích vào giỏ nhé!</p>
                  <button onClick={onClose} style={{
                    marginTop: 8, padding: '10px 28px',
                    border: '1.5px solid #2E1A4A', borderRadius: 999,
                    background: 'transparent', fontSize: 13, fontWeight: 600,
                    color: '#2E1A4A', cursor: 'pointer',
                  }}>
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={item.product.id} style={{
                    display: 'flex', gap: 14, padding: '16px 20px',
                    borderBottom: idx < items.length - 1 ? '1px solid #f5f5f5' : 'none',
                  }}>
                    {/* Image */}
                    <Link href={`/products/${item.product.slug}`} onClick={onClose} style={{
                      width: 88, height: 88, borderRadius: 8, overflow: 'hidden',
                      flexShrink: 0, background: '#f5f5f5', display: 'block',
                    }}>
                      <img src={item.product.image} alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </Link>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <Link href={`/products/${item.product.slug}`} onClick={onClose} style={{
                          fontSize: 13, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden', flex: 1,
                        }}>
                          {item.product.name}
                        </Link>
                        <button onClick={() => removeFromCart(item.product.id)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#ccc', padding: 2, flexShrink: 0, lineHeight: 1,
                          transition: 'color 0.15s',
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ff4d4f'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {item.selectedSize && (
                        <span style={{ fontSize: 11, color: '#999', background: '#f5f5f5', padding: '2px 8px', borderRadius: 4, alignSelf: 'flex-start' }}>
                          {item.selectedSize}
                        </span>
                      )}

                      <button
                        onClick={() => handleSaveForLater(item)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 11, color: '#9B72CF', fontFamily: 'inherit',
                          padding: '2px 0', textAlign: 'left', alignSelf: 'flex-start',
                          display: 'flex', alignItems: 'center', gap: 4,
                          textDecoration: 'underline', textUnderlineOffset: 2,
                        }}
                      >
                        <Heart size={11} />
                        Lưu lại sau
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
                        {/* Qty control */}
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          border: '1px solid #e8e8e8', borderRadius: 6, overflow: 'hidden',
                        }}>
                          <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{
                            width: 30, height: 30, background: 'none', border: 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#555', fontSize: 14,
                          }}>
                            <Minus size={11} />
                          </button>
                          <span style={{
                            width: 32, textAlign: 'center', fontSize: 13, fontWeight: 600,
                            color: '#1a1a1a', borderLeft: '1px solid #e8e8e8', borderRight: '1px solid #e8e8e8',
                            lineHeight: '30px',
                          }}>
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{
                            width: 30, height: 30, background: 'none', border: 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#555',
                          }}>
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#2E1A4A' }}>
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p style={{ fontSize: 11, color: '#bbb' }}>{formatPrice(item.product.price)}/cái</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div style={{
                borderTop: '1px solid #f0f0f0',
                padding: '16px 20px 20px',
                background: '#fff',
                flexShrink: 0,
              }}>
                {/* Totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#888' }}>Tạm tính ({cartCount} sản phẩm)</span>
                    <span style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>{formatPrice(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#888' }}>Phí vận chuyển</span>
                    <span style={{ fontSize: 13, color: shippingFee === 0 ? '#16a34a' : '#333', fontWeight: 500 }}>
                      {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                    </span>
                  </div>
                  <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Tổng cộng</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#2E1A4A' }}>{formatPrice(subtotal + shippingFee)}</span>
                  </div>
                </div>

                {/* Gift wrap */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', marginBottom: 12,
                  background: giftWrap ? '#fdf6ff' : '#fafafa',
                  border: `1.5px solid ${giftWrap ? '#C4A8E8' : '#f0f0f0'}`,
                  borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={e => setGiftWrap(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#2E1A4A', cursor: 'pointer' }}
                  />
                  <Gift size={15} color={giftWrap ? '#9B72CF' : '#aaa'} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Gói quà xinh xắn</p>
                    <p style={{ fontSize: 11, color: '#999', marginTop: 1 }}>Túi vải + thiệp cảm ơn từ Lemini</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#16a34a', background: '#f0fff4',
                    padding: '2px 8px', borderRadius: 999,
                  }}>Miễn phí</span>
                </label>

                {/* CTA */}
                <button onClick={handleCheckout} style={{
                  width: '100%', height: 50,
                  background: '#2E1A4A', color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.3px',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3D2560'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2E1A4A'; }}
                >
                  ĐẶT HÀNG NGAY
                </button>

                <button onClick={onClose} style={{
                  width: '100%', marginTop: 10,
                  background: 'none', border: 'none',
                  fontSize: 13, color: '#999',
                  cursor: 'pointer', padding: '6px 0',
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}>
                  Tiếp tục mua sắm
                </button>
              </div>
            )}
          </>
        )}

        {/* ── STEP: CHECKOUT ── */}
        {step === 'checkout' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Order summary */}
              <div style={{ padding: '16px 20px', borderBottom: '8px solid #f5f5f5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 12 }}>
                  Đơn hàng ({cartCount} sản phẩm)
                </p>
                {items.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={item.product.image} alt={item.product.name}
                        style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', display: 'block' }} />
                      <span style={{
                        position: 'absolute', top: -6, right: -6,
                        background: '#2E1A4A', color: '#fff',
                        fontSize: 10, fontWeight: 700,
                        width: 18, height: 18, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{item.quantity}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product.name}
                      </p>
                      {item.selectedSize && <p style={{ fontSize: 11, color: '#999' }}>{item.selectedSize}</p>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2E1A4A', flexShrink: 0 }}>
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Voucher */}
              <div style={{ padding: '16px 20px', borderBottom: '8px solid #f5f5f5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 12 }}>
                  Mã giảm giá
                </p>
                {voucher ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', background: '#f0fdf4',
                    border: '1px solid #bbf7d0', borderRadius: 8,
                    fontSize: 13, color: '#16a34a', fontWeight: 500,
                  }}>
                    <Tag size={13} />
                    <span style={{ flex: 1 }}>{voucher.code} — {voucher.description}</span>
                    <button onClick={() => { setVoucher(null); setVoucherCode(''); }} style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', lineHeight: 1,
                    }}>×</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        placeholder="Nhập mã voucher..."
                        value={voucherCode}
                        onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); }}
                        onKeyDown={e => e.key === 'Enter' && applyVoucher()}
                        style={{
                          flex: 1, padding: '10px 12px',
                          border: '1px solid #e8e8e8', borderRadius: 8,
                          fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.05em',
                          color: '#1a1a1a', outline: 'none',
                        }}
                      />
                      <button onClick={applyVoucher} disabled={checkingVoucher || !voucherCode.trim()} style={{
                        padding: '0 16px', border: '1.5px solid #2E1A4A',
                        borderRadius: 8, background: 'transparent',
                        color: '#2E1A4A', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        opacity: (checkingVoucher || !voucherCode.trim()) ? 0.4 : 1,
                      }}>
                        {checkingVoucher ? '...' : 'Áp dụng'}
                      </button>
                    </div>
                    {voucherError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{voucherError}</p>}
                  </>
                )}
              </div>

              {/* Delivery form */}
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 12 }}>
                  Thông tin giao hàng
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input placeholder="Họ và tên *" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      style={fieldStyle} />
                    <input placeholder="Số điện thoại *" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      style={fieldStyle} />
                  </div>
                  <input placeholder="Địa chỉ nhận hàng *" value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    style={fieldStyle} />
                  <textarea placeholder="Ghi chú cho shop (tùy chọn)" value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    rows={2}
                    style={{ ...fieldStyle, resize: 'none', fontFamily: 'inherit' } as React.CSSProperties} />
                </div>
              </div>

              {/* Payment method */}
              <div style={{ padding: '16px 20px', borderTop: '8px solid #f5f5f5' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 12 }}>
                  Phương thức thanh toán
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {([
                    { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵' },
                    { id: 'bank', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
                    { id: 'momo', label: 'Ví MoMo', icon: '💜' },
                    { id: 'vnpay', label: 'Thanh toán VNPay', icon: '🏧' },
                  ] as { id: 'cod' | 'bank' | 'momo' | 'vnpay'; label: string; icon: string }[]).map(opt => (
                    <label key={opt.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px',
                      border: `1.5px solid ${paymentMethod === opt.id ? '#2E1A4A' : '#e8e8e8'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: paymentMethod === opt.id ? '#faf8ff' : '#fff',
                      transition: 'all 0.15s',
                    }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={opt.id}
                        checked={paymentMethod === opt.id}
                        onChange={() => setPaymentMethod(opt.id)}
                        style={{ accentColor: '#2E1A4A', width: 15, height: 15, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 16 }}>{opt.icon}</span>
                      <span style={{ fontSize: 13, color: '#333', fontWeight: paymentMethod === opt.id ? 600 : 400 }}>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                  {paymentMethod === 'bank' && (
                    <div style={{
                      padding: '10px 14px',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#0369a1',
                      lineHeight: 1.7,
                    }}>
                      <strong>STK:</strong> 1234 5678 9012 345 · VietcomBank<br />
                      <strong>Tên TK:</strong> CONG TY TNHH LEMINI<br />
                      <span style={{ color: '#64748b' }}>Nội dung: [Mã đơn hàng] + [Họ tên]</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Checkout footer */}
            <div style={{
              borderTop: '1px solid #f0f0f0', padding: '16px 20px 20px',
              background: '#fff', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888' }}>
                  <span>Tạm tính</span><span style={{ color: '#333' }}>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888' }}>
                  <span>Phí vận chuyển</span>
                  <span style={{ color: shippingFee === 0 ? '#16a34a' : '#333' }}>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a' }}>
                    <span>Giảm giá ({voucher?.code})</span>
                    <span>−{formatPrice(discount)}</span>
                  </div>
                )}
                <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Tổng cộng</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#2E1A4A' }}>{formatPrice(total)}</span>
                </div>
              </div>
              {orderError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 10, textAlign: 'center' }}>{orderError}</p>}
              <button onClick={handlePlaceOrder} disabled={placing} style={{
                width: '100%', height: 50,
                background: placing ? '#9B84B3' : '#2E1A4A', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 15, fontWeight: 700,
                cursor: placing ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}>
                {placing
                  ? 'Đang xử lý...'
                  : paymentMethod === 'vnpay'
                    ? `THANH TOÁN VNPAY · ${formatPrice(total)}`
                    : `XÁC NHẬN ĐẶT HÀNG · ${formatPrice(total)}`}
              </button>
            </div>
          </>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === 'success' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '40px 32px', textAlign: 'center', gap: 14,
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <CheckCircle size={40} color="#16a34a" strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
              Đặt hàng thành công!
            </h3>
            <div style={{
              background: '#fafafa', border: '1px solid #f0f0f0',
              borderRadius: 8, padding: '10px 20px', width: '100%',
            }}>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>Mã đơn hàng</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#2E1A4A', fontFamily: 'monospace' }}>
                {lastOrderCode}
              </p>
            </div>
            <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7, maxWidth: 260 }}>
              Chúng tôi sẽ liên hệ xác nhận và giao hàng trong thời gian sớm nhất.
            </p>
            <Link href="/account/orders" onClick={onClose} style={{
              marginTop: 8, width: '100%', height: 50,
              background: '#2E1A4A', color: '#fff',
              borderRadius: 8, fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none',
            }}>
              Xem đơn hàng của tôi
            </Link>
            <button onClick={onClose} style={{
              background: 'none', border: 'none',
              fontSize: 13, color: '#999', cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>,
    document.body
  );
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1px solid #e8e8e8',
  borderRadius: 8,
  fontSize: 13,
  color: '#1a1a1a',
  background: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};
