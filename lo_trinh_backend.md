# Lộ Trình Hoàn Thiện Backend — Lemini Webshop

> Mục tiêu: Chuyển từ JSON file storage → Production-ready backend
> Ước tính: ~1 tuần nếu làm full-time

---

## Tổng quan tiến độ

| Giai đoạn | Nội dung | Thời gian | Trạng thái |
|-----------|----------|-----------|-----------|
| Phase 1 | Supabase Database | 2-3 ngày | [x] Code xong — cần tạo Supabase account |
| Phase 2 | User Authentication | 1-2 ngày | [ ] |
| Phase 3 | Cloud Image Storage | vài giờ | [ ] |
| Phase 4 | Email Notifications | 1 ngày | [ ] |
| Phase 5 | Payment Gateway | 2-3 ngày | [ ] |
| Phase 6 | Deploy Production | 1 ngày | [ ] |

---

## Phase 1 — Supabase Database

> Thay thế JSON file stores bằng PostgreSQL thật

### 1.1 Thiet lap Supabase
- [ ] Tao tai khoan tai supabase.com (free) ← **ban tu lam**
- [ ] Tao project moi "lemini-webshop" ← **ban tu lam**
- [ ] Lay `SUPABASE_URL` va `SUPABASE_SERVICE_KEY` tu Settings > API ← **ban tu lam**
- [x] Cai package: `npm install @supabase/supabase-js` ✅
- [x] Tao file `Admin/src/lib/supabase.ts` — khoi tao client ✅

### 1.2 Tao Database Schema
- [x] Tao SQL schema day du (7 bang) — file `Admin/supabase/schema.sql` ✅
  - [x] Bang `products`
  - [x] Bang `categories`
  - [x] Bang `orders`
  - [x] Bang `reviews`
  - [x] Bang `promotions`
  - [x] Bang `inventory_log`
  - [x] Bang `settings`
- [ ] Chay `Admin/supabase/schema.sql` trong Supabase Dashboard > SQL Editor ← **ban tu lam**
- [ ] Migrate du lieu tu JSON files hien tai len Supabase ← **lam sau khi co account**

### 1.3 Thay the Store Files (Admin)
- [x] Viet lai `Admin/src/lib/productStore.ts` — Supabase + JSON fallback ✅
- [x] Viet lai `Admin/src/lib/categoryStore.ts` — Supabase + JSON fallback ✅
- [x] Viet lai `Admin/src/lib/orderStore.ts` — Supabase + JSON fallback ✅
- [x] Viet lai `Admin/src/lib/reviewStore.ts` — Supabase + JSON fallback ✅
- [x] Viet lai `Admin/src/lib/promotionStore.ts` — Supabase + JSON fallback ✅
- [x] Viet lai `Admin/src/lib/inventoryLogStore.ts` — Supabase + JSON fallback ✅
- [x] Viet lai `Admin/src/lib/settingsStore.ts` — Supabase + JSON fallback ✅

### 1.4 Cap nhat API Routes (async/await)
- [x] `GET/POST /api/products` ✅
- [x] `GET/PUT/DELETE /api/products/:id` ✅
- [x] `GET/POST /api/categories` ✅
- [x] `PUT/DELETE /api/categories/:id` ✅
- [x] `GET/POST /api/orders` ✅
- [x] `GET/PUT/DELETE /api/orders/:id` ✅
- [x] `GET/POST /api/reviews` ✅
- [x] `PUT/DELETE /api/reviews/:id` ✅
- [x] `GET/POST /api/promotions` ✅
- [x] `PUT/DELETE /api/promotions/:id` ✅
- [x] `GET /api/stats` ✅
- [x] `GET/PUT /api/settings` ✅
- [x] `GET/POST /api/inventory-log` ✅
- [x] Tao `.env.example` va `.env.local` cho Admin ✅
- [x] Build kiem tra — khong co TypeScript error ✅

### 1.5 Test voi Supabase that (lam sau khi co account)
- [x] Dien `SUPABASE_URL` va `SUPABASE_SERVICE_KEY` vao `.env.local` ✅
- [x] Test `GET /api/products` tra dung du lieu tu DB ✅
- [x] Test `POST /api/categories` tao moi vao DB — xac nhan Supabase hoat dong ✅
- [x] Test `GET /api/categories` lay du lieu tu Supabase ✅
- [ ] Test `POST /api/products` tao moi qua Admin UI
- [ ] Test `PUT /api/products/:id` cap nhat dung
- [ ] Test `DELETE /api/products/:id` xoa dung
- [ ] Test orders, reviews, promotions qua UI
- [ ] Migrate du lieu tu JSON files (Admin/data/) len Supabase — neu can
- [ ] Xoa thu muc `Admin/data/` khi da migrate xong

---

## Phase 2 — User Authentication

> Thay localStorage auth bằng backend thật

### 2.1 Thiết lập Supabase Auth
- [ ] Bat Email Auth trong Supabase Dashboard > Authentication > Providers ← **ban tu lam**
- [ ] Tat "Confirm email" trong Authentication > Email neu muon dang ky khong can xac nhan email ← **ban tu lam**
- [x] Tao bang `profiles` (id, email, name, phone, address, joined_at) — file `User/supabase/schema.sql` ✅
- [x] Tao Row Level Security (RLS) policies cho bang profiles ✅
- [x] Tao trigger tu dong tao profile khi user dang ky ✅
- [ ] Chay `User/supabase/schema.sql` trong Supabase Dashboard > SQL Editor ← **ban tu lam**

### 2.2 Cap nhat User App
- [x] Cai package: `npm install @supabase/supabase-js` ✅
- [x] Tao `User/src/lib/supabase.ts` ✅
- [x] Viet lai `AuthContext.tsx` — dung Supabase Auth thay localStorage ✅
  - [x] `register()` → `supabase.auth.signUp()` ✅
  - [x] `login()` → `supabase.auth.signInWithPassword()` ✅
  - [x] `logout()` → `supabase.auth.signOut()` ✅
  - [x] `loginWithOAuth()` → `supabase.auth.signInWithOAuth()` ✅
- [x] Cap nhat trang Profile — luu/doc tu bang `profiles` ✅
- [x] Dien `NEXT_PUBLIC_SUPABASE_URL` vao `User/.env.local` ✅
- [ ] Dien `NEXT_PUBLIC_SUPABASE_ANON_KEY` vao `User/.env.local` ← **ban tu lam**
- [x] Build kiem tra — khong co TypeScript error ✅

### 2.3 Lien ket Orders voi User
- [ ] Them cot `user_id` vao bang `orders` trong Supabase
- [ ] Cap nhat `OrdersContext.tsx` — loc don hang theo `user_id` thay vi email
- [ ] Them RLS: user chi xem duoc don hang cua minh

---

## Phase 3 — Cloud Image Storage

> Thay lưu ảnh local bằng Cloudinary

### 3.1 Thiết lập Cloudinary
- [x] Tao tai khoan tai cloudinary.com (free 25GB) ✅
- [x] Lay `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` ✅
- [x] Dien vao `Admin/.env.local` ✅
- [x] Cai package: `npm install cloudinary` ✅

### 3.2 Cap nhat Upload API
- [x] Sua `Admin/src/app/api/upload/route.ts` ✅
  - [x] Upload file len Cloudinary thay vi luu `public/uploads/` ✅
  - [x] Tra ve Cloudinary URL thay vi `/uploads/...` ✅
  - [x] Giu fallback local neu chua co Cloudinary credentials ✅
- [x] Them toi uu anh tu dong (resize 1200px, compress, WebP format) ✅
- [x] Build kiem tra — khong co TypeScript error ✅
- [ ] Xoa thu muc `Admin/public/uploads/` (lam sau khi da dien credentials va test xong)

---

## Phase 4 — Email Notifications

> Gửi email tự động cho khách hàng và admin

### 4.1 Thiet lap Resend (email service mien phi)
- [ ] Tao tai khoan tai resend.com (free 3000 email/thang) ← **ban tu lam**
- [ ] Lay `RESEND_API_KEY` ← **ban tu lam**
- [ ] Dien `RESEND_API_KEY` va `ADMIN_EMAIL` vao `Admin/.env.local` ← **ban tu lam**
- [x] Cai package: `npm install resend` ✅
- [x] Tao `Admin/src/lib/email.ts` — helper gui email voi HTML template dep ✅

### 4.2 Email cho Khach hang
- [x] Gui email xac nhan don hang sau khi dat thanh cong ✅
- [x] Gui email cap nhat trang thai don (khi Admin doi status) ✅
- [ ] Email xac nhan dang ky tai khoan — Supabase Auth tu dong gui (cau hinh trong Supabase Dashboard)
- [ ] Email reset mat khau — Supabase Auth tu dong gui

### 4.3 Email cho Admin
- [x] Thong bao co don hang moi ✅
- [x] Thong bao san pham sap het hang (< 5 san pham) ✅
- [x] Build kiem tra — khong co TypeScript error ✅

---

## Phase 5 — Payment Gateway

> Tích hợp thanh toán thật

### 5.1 Chọn cổng thanh toán
- [x] **VNPay** — phổ biến nhất Việt Nam, sandbox miễn phí ✅
  - [ ] Đăng ký tài khoản merchant VNPay ← **bạn tự làm**
  - [ ] Lấy `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` và điền vào `User/.env.local` ← **bạn tự làm**
  - [x] Không cần cài package — dùng built-in `crypto` của Node.js ✅

### 5.2 Tích hợp VNPay
- [x] Tạo `User/src/app/api/payment/vnpay/route.ts` — tạo URL thanh toán ✅
- [x] Tạo `User/src/app/api/payment/vnpay-return/route.ts` — xử lý callback ✅
- [x] Cập nhật CartDrawer — thêm VNPay option + redirect ✅
- [x] Tạo trang `User/src/app/payment/success/page.tsx` ✅
- [x] Tạo trang `User/src/app/payment/failed/page.tsx` ✅
- [x] Cập nhật trạng thái đơn hàng sau khi thanh toán thành công (`confirmed`) ✅
- [x] Build kiểm tra — không có TypeScript error ✅
- [ ] Test với sandbox VNPay ← **làm sau khi có credentials**

### 5.3 (Tùy chọn) Thêm MoMo
- [ ] Đăng ký MoMo Business
- [ ] Tích hợp tương tự VNPay

---

## Phase 6 — Deploy Production

> Đưa lên internet chạy thật

### 6.1 Chuẩn bị Environment Variables
- [ ] Tạo file `.env.production` cho Admin
  ```
  SUPABASE_URL=...
  SUPABASE_ANON_KEY=...
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  RESEND_API_KEY=...
  ADMIN_USERNAME=...
  ADMIN_PASSWORD=...
  CORS_ORIGIN=https://your-user-domain.vercel.app
  ```
- [ ] Tạo file `.env.production` cho User
  ```
  NEXT_PUBLIC_ADMIN_API=https://your-admin-domain.railway.app
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```

### 6.2 Deploy Admin (Railway)
- [ ] Push code lên GitHub
- [ ] Kết nối Railway với GitHub repo
- [ ] Set Root Directory = `Admin`
- [ ] Điền tất cả environment variables
- [ ] Deploy và kiểm tra `/api/stats` trả về 200

### 6.3 Deploy User (Vercel)
- [ ] Kết nối Vercel với GitHub repo
- [ ] Set Root Directory = `User`
- [ ] Điền environment variables (đặc biệt `NEXT_PUBLIC_ADMIN_API`)
- [ ] Deploy và kiểm tra trang chủ load đúng sản phẩm

### 6.4 Kiểm tra sau deploy
- [ ] Đặt thử 1 đơn hàng từ đầu đến cuối
- [ ] Kiểm tra đơn hiện trong Admin
- [ ] Đổi trạng thái đơn trong Admin → User thấy cập nhật
- [ ] Upload ảnh sản phẩm mới trong Admin
- [ ] Kiểm tra email thông báo gửi đúng
- [ ] Test thanh toán với sandbox

---

## Công nghệ sử dụng

| Mục đích | Công nghệ | Gói miễn phí |
|----------|-----------|-------------|
| Database | Supabase (PostgreSQL) | 500MB, unlimited requests |
| Authentication | Supabase Auth | Unlimited users |
| Image Storage | Cloudinary | 25GB storage |
| Email | Resend | 3,000 email/tháng |
| Payment | VNPay Sandbox | Miễn phí khi test |
| Deploy Admin | Railway | $5 credit/tháng |
| Deploy User | Vercel | Unlimited cho hobby |

---

## Thứ tự ưu tiên

```
Phase 1 (Database) → Phase 2 (Auth) → Phase 3 (Images)
       → Phase 6 (Deploy) → Phase 4 (Email) → Phase 5 (Payment)
```

> **Ghi chú:** Phase 1-3 + Phase 6 là bắt buộc để có hệ thống chạy thật.
> Phase 4-5 có thể làm sau khi đã deploy.
