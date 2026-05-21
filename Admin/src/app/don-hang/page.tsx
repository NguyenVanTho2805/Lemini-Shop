"use client";

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, Search, ChevronDown, ChevronUp, Package, Calendar, X, Printer } from "lucide-react";
import { formatVND } from "@/lib/data";
import type { AdminOrder, OrderStatus } from "@/lib/orderStore";

const ADMIN_API = "http://localhost:3001";

const STATUS_TABS: { value: OrderStatus | "all"; label: string; color: string }[] = [
  { value: "all", label: "Tất cả", color: "#0f172a" },
  { value: "pending", label: "Chờ xác nhận", color: "#b45309" },
  { value: "shipping", label: "Đang giao", color: "#2563eb" },
  { value: "completed", label: "Hoàn thành", color: "#059669" },
  { value: "cancelled", label: "Đã hủy", color: "#ef4444" },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "shipping",
  shipping: "completed",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [trackingEdit, setTrackingEdit] = useState<Record<string, { carrier: string; trackingNumber: string }>>({});
  const [savingTracking, setSavingTracking] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/api/orders`);
      setOrders(await res.json());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = useMemo(() => {
    let list = tab === "all" ? orders : orders.filter(o => o.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }
    if (dateFrom) list = list.filter(o => o.createdAt.slice(0, 10) >= dateFrom);
    if (dateTo) list = list.filter(o => o.createdAt.slice(0, 10) <= dateTo);
    return list;
  }, [orders, tab, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    STATUS_TABS.slice(1).forEach(t => { c[t.value] = orders.filter(o => o.status === t.value).length; });
    return c;
  }, [orders]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    try {
      await fetch(`${ADMIN_API}/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } finally {
      setUpdating(null);
    }
  };

  const initTracking = (order: AdminOrder) => {
    if (!trackingEdit[order.id]) {
      setTrackingEdit(prev => ({
        ...prev,
        [order.id]: { carrier: order.carrier ?? '', trackingNumber: order.trackingNumber ?? '' },
      }));
    }
  };

  const saveTracking = async (id: string) => {
    const t = trackingEdit[id];
    if (!t) return;
    setSavingTracking(id);
    try {
      await fetch(`${ADMIN_API}/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier: t.carrier, trackingNumber: t.trackingNumber }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, carrier: t.carrier, trackingNumber: t.trackingNumber } : o));
    } finally { setSavingTracking(null); }
  };

  const statusInfo = (s: OrderStatus) => STATUS_TABS.find(t => t.value === s) ?? STATUS_TABS[1];

  const printDeliverySlip = (order: AdminOrder) => {
    const win = window.open("", "_blank", "width=640,height=900");
    if (!win) return;
    const paymentLabel = ({ cod: "Thanh toán khi nhận hàng (COD)", bank: "Chuyển khoản ngân hàng", momo: "Ví MoMo", vnpay: "VNPay" } as Record<string, string>)[order.paymentMethod ?? "cod"] ?? order.paymentMethod;
    const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    win.document.write(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8">
<title>Phiếu giao hàng — ${order.code}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #000; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 14px; margin-bottom: 16px; }
  .store-name { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; }
  .store-sub { font-size: 11px; color: #555; margin-top: 3px; }
  .order-code { font-size: 16px; font-weight: 700; font-family: monospace; }
  .order-date { font-size: 11px; color: #555; margin-top: 3px; text-align: right; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .field-label { font-size: 10px; color: #777; margin-bottom: 2px; }
  .field-value { font-size: 13px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f5f5f5; padding: 6px 8px; text-align: left; border: 1px solid #ddd; font-size: 11px; }
  td { padding: 7px 8px; border: 1px solid #ddd; vertical-align: middle; }
  .text-right { text-align: right; }
  .total-row td { font-weight: 700; background: #f9f9f9; }
  .grand-total td { font-size: 15px; font-weight: 900; border-top: 2px solid #000; }
  .footer { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .sig-box { border-top: 1px dashed #aaa; padding-top: 8px; font-size: 11px; color: #555; text-align: center; height: 60px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  @media print { .no-print { display: none; } }
</style></head><body>
<div class="header">
  <div>
    <div class="store-name">Lemini</div>
    <div class="store-sub">Thêu thùa handmade · lemini.vn</div>
  </div>
  <div style="text-align:right">
    <div class="order-code">${order.code}</div>
    <div class="order-date">${new Date(order.createdAt).toLocaleString("vi-VN")}</div>
    <div class="order-date" style="margin-top:4px">
      <span class="badge" style="background:${statusInfo(order.status).color}22;color:${statusInfo(order.status).color};border:1px solid ${statusInfo(order.status).color}44">
        ${statusInfo(order.status).label}
      </span>
    </div>
  </div>
</div>

<div class="grid2 section">
  <div>
    <div class="section-title">Người nhận</div>
    <div class="field-label">Họ tên</div><div class="field-value">${order.customerName}</div>
    <div class="field-label" style="margin-top:6px">Điện thoại</div><div class="field-value">${order.customerPhone}</div>
    <div class="field-label" style="margin-top:6px">Email</div><div class="field-value" style="font-weight:400;font-size:12px">${order.customerEmail}</div>
  </div>
  <div>
    <div class="section-title">Địa chỉ giao hàng</div>
    <div class="field-value" style="line-height:1.5">${order.address}</div>
    ${order.carrier || order.trackingNumber ? `
    <div class="field-label" style="margin-top:8px">Mã vận đơn</div>
    <div class="field-value" style="font-family:monospace">${order.carrier ?? ""} ${order.trackingNumber ?? ""}</div>` : ""}
  </div>
</div>

<div class="section">
  <div class="section-title">Danh sách sản phẩm</div>
  <table>
    <thead><tr><th>Sản phẩm</th><th class="text-right">Đơn giá</th><th class="text-right">SL</th><th class="text-right">Thành tiền</th></tr></thead>
    <tbody>
      ${order.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td class="text-right">${item.price.toLocaleString("vi-VN")}đ</td>
        <td class="text-right">${item.quantity}</td>
        <td class="text-right">${(item.price * item.quantity).toLocaleString("vi-VN")}đ</td>
      </tr>`).join("")}
    </tbody>
    <tfoot>
      <tr class="total-row"><td colspan="3" class="text-right">Tạm tính</td><td class="text-right">${subtotal.toLocaleString("vi-VN")}đ</td></tr>
      <tr class="total-row"><td colspan="3" class="text-right">Phí vận chuyển</td><td class="text-right">${order.shippingFee.toLocaleString("vi-VN")}đ</td></tr>
      ${order.discount > 0 ? `<tr class="total-row"><td colspan="3" class="text-right">Giảm giá${order.voucherCode ? ` (${order.voucherCode})` : ""}</td><td class="text-right" style="color:#dc2626">−${order.discount.toLocaleString("vi-VN")}đ</td></tr>` : ""}
      <tr class="grand-total"><td colspan="3" class="text-right">Tổng cộng</td><td class="text-right" style="color:#059669">${order.total.toLocaleString("vi-VN")}đ</td></tr>
    </tfoot>
  </table>
</div>

<div style="font-size:12px;color:#555;margin-bottom:16px">
  💳 Thanh toán: <strong>${paymentLabel}</strong>
  ${order.note ? `&nbsp;·&nbsp; 📝 Ghi chú: <em>${order.note}</em>` : ""}
</div>

<div class="footer">
  <div class="sig-box">Người giao hàng<br><small>(Ký, ghi rõ họ tên)</small></div>
  <div class="sig-box">Người nhận hàng<br><small>(Ký, ghi rõ họ tên)</small></div>
</div>

<div style="text-align:center;margin-top:16px" class="no-print">
  <button onclick="window.print()" style="padding:8px 24px;font-size:13px;cursor:pointer;background:#059669;color:#fff;border:none;border-radius:6px">🖨️ In phiếu</button>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Quản Lý Đơn Hàng
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
            Đơn hàng từ khách hàng — cập nhật theo thời gian thực
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchOrders} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Tổng đơn", value: counts.all, color: "#0f172a" },
          { label: "Chờ xác nhận", value: counts.pending ?? 0, color: "#b45309" },
          { label: "Đang giao", value: counts.shipping ?? 0, color: "#2563eb" },
          { label: "Hoàn thành", value: counts.completed ?? 0, color: "#059669" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-input)", borderRadius: 8, padding: 4, flexWrap: "wrap" }}>
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              style={{
                padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
                background: tab === t.value ? "#fff" : "transparent",
                color: tab === t.value ? t.color : "var(--text-muted)",
                boxShadow: tab === t.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t.label} ({counts[t.value] ?? 0})
            </button>
          ))}
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input"
            placeholder="Tìm mã đơn, tên, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32, width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={14} color="var(--text-muted)" />
          <input
            className="input"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ width: 150 }}
          />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
          <input
            className="input"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ width: 150 }}
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}
              title="Xóa bộ lọc ngày"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
          <Package size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(order => {
            const s = statusInfo(order.status);
            const open = expanded === order.id;
            const next = NEXT_STATUS[order.status];
            return (
              <div key={order.id} className="card" style={{ overflow: "hidden", padding: 0 }}>
                <button
                  onClick={() => setExpanded(open ? null : order.id)}
                  style={{
                    display: "grid", gridTemplateColumns: "180px 1fr 140px 130px 28px",
                    gap: 16, width: "100%", padding: "16px 20px",
                    background: "transparent", border: "none", cursor: "pointer",
                    textAlign: "left", fontFamily: "inherit", alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{order.code}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{order.customerName}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{order.customerEmail}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#059669" }}>
                    {formatVND(order.total)}
                    {order.discount > 0 && (
                      <span style={{ fontSize: 11, color: "#ef4444", display: "block", fontWeight: 500 }}>
                        −{formatVND(order.discount)}
                      </span>
                    )}
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30`,
                  }}>
                    {s.label}
                  </span>
                  {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </button>

                {open && (() => {
                  initTracking(order);
                  const t = trackingEdit[order.id] ?? { carrier: order.carrier ?? '', trackingNumber: order.trackingNumber ?? '' };
                  return (
                    <div style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-input)", padding: "16px 20px" }}>
                      <div style={{ marginBottom: 14 }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                            <img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{item.name}</div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>x{item.quantity}</div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{formatVND(item.price * item.quantity)}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>
                        <div>📍 {order.address}</div>
                        <div>📞 {order.customerPhone}</div>
                        {order.voucherCode && <div>🏷️ Mã: <strong>{order.voucherCode}</strong></div>}
                        <div>🚚 Phí ship: {formatVND(order.shippingFee)}</div>
                        {order.paymentMethod && (
                          <div>💳 Thanh toán: <strong>
                            {({ cod: "COD (Tiền mặt)", bank: "Chuyển khoản", momo: "MoMo", vnpay: "VNPay" } as Record<string, string>)[order.paymentMethod] ?? order.paymentMethod}
                          </strong></div>
                        )}
                        {order.note && <div style={{ gridColumn: "1/-1" }}>📝 {order.note}</div>}
                      </div>

                      {/* Tracking number section */}
                      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          🚛 Thông tin vận chuyển
                        </div>
                        {order.trackingNumber && (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                            Hiện tại: <strong style={{ color: "var(--text-primary)", fontFamily: "monospace" }}>{order.carrier} · {order.trackingNumber}</strong>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            className="input"
                            placeholder="Đơn vị (GHN, GHTK...)"
                            value={t.carrier}
                            onChange={e => setTrackingEdit(prev => ({ ...prev, [order.id]: { ...t, carrier: e.target.value } }))}
                            style={{ width: 160 }}
                          />
                          <input
                            className="input"
                            placeholder="Mã vận đơn"
                            value={t.trackingNumber}
                            onChange={e => setTrackingEdit(prev => ({ ...prev, [order.id]: { ...t, trackingNumber: e.target.value } }))}
                            style={{ flex: 1, minWidth: 180 }}
                          />
                          <button
                            className="btn btn-outline"
                            disabled={savingTracking === order.id}
                            onClick={() => saveTracking(order.id)}
                            style={{ fontSize: 12, whiteSpace: "nowrap" }}
                          >
                            {savingTracking === order.id ? "Đang lưu..." : "Lưu tracking"}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        {next && (
                          <button className="btn btn-primary" disabled={updating === order.id}
                            onClick={() => updateStatus(order.id, next)} style={{ fontSize: 12 }}>
                            {updating === order.id ? "Đang cập nhật..." : `→ ${statusInfo(next).label}`}
                          </button>
                        )}
                        {order.status === "pending" && (
                          <button className="btn btn-outline" disabled={updating === order.id}
                            onClick={() => updateStatus(order.id, "cancelled")}
                            style={{ fontSize: 12, color: "#ef4444", borderColor: "#fca5a5" }}>
                            Hủy đơn
                          </button>
                        )}
                        <button
                          className="btn btn-outline"
                          onClick={() => printDeliverySlip(order)}
                          style={{ fontSize: 12, marginLeft: "auto" }}
                        >
                          <Printer size={13} />
                          In phiếu giao hàng
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
