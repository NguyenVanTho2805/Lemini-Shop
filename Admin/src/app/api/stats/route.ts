import { getOrders } from '@/lib/orderStore';
import { getProducts } from '@/lib/productStore';
import { getPromotions } from '@/lib/promotionStore';
import { getCategories } from '@/lib/categoryStore';

export async function GET() {
  const [orders, products, promotions, categories] = await Promise.all([
    getOrders(), getProducts(), getPromotions(), getCategories(),
  ]);

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);

  const year = new Date().getFullYear();
  const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
  const revenueByMonth = MONTHS.map((month, i) => {
    const done = completedOrders.filter(o => { const d = new Date(o.createdAt); return d.getFullYear() === year && d.getMonth() === i; });
    const all = orders.filter(o => { const d = new Date(o.createdAt); return d.getFullYear() === year && d.getMonth() === i; });
    return { month, revenue: done.reduce((s, o) => s + o.total, 0), orders: all.length };
  });

  const topProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5)
    .map(p => ({ id: p.id, name: p.name, sold: p.sold, revenue: p.sold * p.price, image: p.images?.[0] ?? p.image }));

  const lowStock = [...products].filter(p => p.stock < 10 && p.status === 'active').sort((a, b) => a.stock - b.stock).slice(0, 5)
    .map(p => ({ id: p.id, name: p.name, stock: p.stock, image: p.images?.[0] ?? p.image }));

  const categoryDist = categories.map(c => ({
    name: c.name, slug: c.slug, icon: c.icon,
    productCount: products.filter(p => p.category === c.slug).length,
    revenue: completedOrders.filter(o => o.items?.some?.((item: { productId: string }) => products.find(p => p.id === item.productId)?.category === c.slug)).reduce((s, o) => s + o.total, 0),
  }));

  const recentOrders = orders.slice(0, 8).map(o => ({ id: o.id, code: o.code, customerName: o.customerName, customerEmail: o.customerEmail, total: o.total, status: o.status, createdAt: o.createdAt, itemCount: o.items?.length ?? 0 }));

  return Response.json({
    summary: {
      totalRevenue, totalOrders: orders.length, completedOrders: completedOrders.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalProducts: products.length, totalSold: products.reduce((s, p) => s + p.sold, 0),
      activeVouchers: promotions.filter(p => p.status === 'active').length,
      lowStockCount: products.filter(p => p.stock < 10 && p.status === 'active').length,
    },
    orders: { byStatus: { pending: orders.filter(o => o.status === 'pending').length, shipping: orders.filter(o => o.status === 'shipping').length, completed: completedOrders.length, cancelled: orders.filter(o => o.status === 'cancelled').length }, recent: recentOrders },
    revenue: { byMonth: revenueByMonth },
    products: { top: topProducts, lowStock },
    categories: categoryDist,
    promotions: { total: promotions.length, active: promotions.filter(p => p.status === 'active').length, totalUsage: promotions.reduce((s, p) => s + p.usageCount, 0) },
  });
}
