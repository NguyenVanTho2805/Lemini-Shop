'use client';

import Link from 'next/link';
import { Search, ShoppingBag, User, Menu, X, ChevronDown, LogOut, LayoutDashboard, Package, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { mockCategories } from '@/lib/data';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import SearchModal from '@/components/ui/SearchModal';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const { cartCount, cartOpen, openCart, closeCart } = useCart();
  const { isLoggedIn, user, logout, openAuthModal } = useAuth();
  const { count: wishCount } = useWishlist();

  const initials = user?.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() ?? '';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header className={cn('header', isScrolled && 'scrolled')}>
        <div className="header-inner">
          {/* Left nav */}
          <div className="left">
            <button
              className="icon-btn mobile-menu"
              aria-label="Menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            <nav className="desktop-nav">
              <Link href="/products" className="nav-link">Sản Phẩm</Link>

              {/* Collections dropdown */}
              <div className="dropdown-wrap" ref={dropdownRef}>
                <button
                  className="nav-link nav-link--btn"
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-expanded={dropdownOpen}
                >
                  Bộ Sưu Tập
                  <ChevronDown
                    size={14}
                    className={cn('chevron', dropdownOpen && 'chevron--open')}
                  />
                </button>

                {dropdownOpen && (
                  <div className="dropdown">
                    <div className="dropdown-header">
                      <Link
                        href="/collections"
                        className="dropdown-all"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Xem tất cả bộ sưu tập →
                      </Link>
                    </div>
                    <div className="dropdown-grid">
                      {mockCategories.map(cat => (
                        <Link
                          key={cat.id}
                          href={`/collections/${cat.slug}`}
                          className="dropdown-item"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <img src={cat.image} alt={cat.name} className="dropdown-img" />
                          <span className="dropdown-name">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/blog" className="nav-link">Blog</Link>
              <Link href="/about" className="nav-link">Về Chúng Tôi</Link>
              <Link href="/contact" className="nav-link">Liên Hệ</Link>
            </nav>
          </div>

          {/* Logo */}
          <div className="center">
            <Link href="/" className="logo">Lemini</Link>
          </div>

          {/* Right icons */}
          <div className="right">
            {/* Search */}
            <button
              id="btn-search"
              className="icon-btn"
              aria-label="Tìm kiếm"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={20} />
            </button>

            {/* Account */}
            <div className="account-wrap" ref={accountRef}>
              <button
                id="btn-account"
                className={cn('icon-btn', accountOpen && 'icon-btn--active')}
                aria-label="Tài khoản"
                onClick={() => setAccountOpen(v => !v)}
              >
                {isLoggedIn ? (
                  <div className="user-avatar-mini">{initials}</div>
                ) : (
                  <User size={20} />
                )}
              </button>

              {accountOpen && (
                <div className="account-dropdown">
                  {isLoggedIn ? (
                    <>
                      <div className="account-user-info">
                        <div className="account-avatar">{initials}</div>
                        <div>
                          <p className="account-user-name">{user!.name}</p>
                          <p className="account-user-email">{user!.email}</p>
                        </div>
                      </div>
                      <div className="account-divider" />
                      <div className="account-menu">
                        <Link href="/account" className="account-menu-item" onClick={() => setAccountOpen(false)}>
                          <LayoutDashboard size={15} /> Tổng quan
                        </Link>
                        <Link href="/account/orders" className="account-menu-item" onClick={() => setAccountOpen(false)}>
                          <Package size={15} /> Đơn hàng của tôi
                        </Link>
                        <Link href="/account/wishlist" className="account-menu-item" onClick={() => setAccountOpen(false)}>
                          <Heart size={15} /> Yêu thích {wishCount > 0 && <span className="menu-count">{wishCount}</span>}
                        </Link>
                      </div>
                      <div className="account-divider" />
                      <button className="logout-item" onClick={() => { logout(); setAccountOpen(false); }}>
                        <LogOut size={15} /> Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="account-greeting">Xin chào! 👋</p>
                      <div className="account-links">
                        <button
                          className="account-link account-link--primary"
                          onClick={() => { openAuthModal('login'); setAccountOpen(false); }}
                        >
                          Đăng nhập
                        </button>
                        <button
                          className="account-link"
                          onClick={() => { openAuthModal('register'); setAccountOpen(false); }}
                        >
                          Tạo tài khoản
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              id="btn-cart"
              className="icon-btn cart-btn"
              aria-label="Giỏ hàng"
              onClick={() => cartOpen ? closeCart() : openCart()}
            >
              <ShoppingBag size={20} />
              {mounted && cartCount > 0 && (
                <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>
              )}
            </button>
          </div>
        </div>

        <style jsx>{`
          .header {
            position: sticky;
            top: 0;
            z-index: 100;
            background-color: var(--color-bg);
            transition: var(--transition-normal);
            border-bottom: 1px solid transparent;
          }

          .header.scrolled {
            background-color: rgba(250, 248, 255, 0.95);
            backdrop-filter: blur(8px);
            border-bottom-color: var(--color-border);
            box-shadow: var(--shadow-sm);
          }

          .header-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 72px;
            padding: 0 var(--section-pad-x);
            max-width: var(--container-max);
            margin: 0 auto;
          }

          .left, .right {
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
          }

          .right { justify-content: flex-end; }
          .center { display: flex; justify-content: center; }

          :global(.logo) {
            font-family: var(--font-display);
            font-size: 28px;
            font-weight: 500;
            color: var(--color-primary);
            letter-spacing: 0.02em;
          }

          .desktop-nav {
            display: flex;
            align-items: center;
            gap: 24px;
            margin-left: 8px;
          }

          :global(.nav-link) {
            font-size: 13px;
            font-weight: 500;
            color: var(--color-text);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: color 0.2s;
          }

          :global(.nav-link:hover) { color: var(--color-primary); }

          .nav-link--btn {
            display: flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            cursor: pointer;
            font-family: var(--font-body);
            padding: 0;
          }

          :global(.chevron) {
            transition: transform 0.2s ease;
            color: var(--color-text-muted);
          }

          :global(.chevron--open) { transform: rotate(180deg); }

          /* Collections dropdown */
          .dropdown-wrap { position: relative; }

          .dropdown {
            position: absolute;
            top: calc(100% + 16px);
            left: 50%;
            transform: translateX(-50%);
            width: 380px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            animation: dropIn 0.18s ease;
          }

          @keyframes dropIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }

          .dropdown-header {
            padding: 14px 16px;
            border-bottom: 1px solid var(--color-border);
            background: var(--color-bg-alt);
          }

          :global(.dropdown-all) {
            font-size: 12px;
            font-weight: 600;
            color: var(--color-accent);
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          :global(.dropdown-all:hover) { opacity: 0.7; }

          .dropdown-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1px;
            background: var(--color-border);
          }

          :global(.dropdown-item) {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: var(--color-surface);
            transition: background 0.15s;
          }

          :global(.dropdown-item:hover) { background: var(--color-bg-alt); }

          .dropdown-img {
            width: 44px;
            height: 44px;
            border-radius: var(--radius-md);
            object-fit: cover;
            flex-shrink: 0;
          }

          .dropdown-name {
            font-size: 13px;
            font-weight: 500;
            color: var(--color-text);
          }

          /* Icon buttons */
          .icon-btn {
            background: transparent;
            border: none;
            color: var(--color-text);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            transition: background-color 0.2s, color 0.2s;
            flex-shrink: 0;
          }

          .icon-btn:hover { background-color: var(--color-bg-alt); }
          .icon-btn--active { background-color: var(--color-accent-muted); color: var(--color-accent); }

          .cart-btn { position: relative; }

          .cart-badge {
            position: absolute;
            top: 0px;
            right: 0px;
            background-color: var(--color-accent);
            color: white;
            font-size: 10px;
            font-weight: 700;
            min-width: 16px;
            height: 16px;
            padding: 0 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-full);
          }

          /* Account dropdown */
          .account-wrap { position: relative; }

          .user-avatar-mini {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
            color: #fff;
            font-family: var(--font-display);
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .account-dropdown {
            position: absolute;
            top: calc(100% + 12px);
            right: 0;
            width: 248px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            overflow: hidden;
            animation: dropIn 0.18s ease;
          }

          @keyframes dropIn {
            from { opacity: 0; transform: translateY(-8px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .account-user-info {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
          }

          .account-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
            color: #fff;
            font-family: var(--font-display);
            font-size: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .account-user-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .account-user-email {
            font-size: 12px;
            color: var(--color-text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 2px;
          }

          .account-greeting {
            padding: 16px 16px 12px;
            font-size: 14px;
            color: var(--color-text-secondary);
            border-bottom: 1px solid var(--color-border);
          }

          .account-links {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 14px 16px;
          }

          .account-link {
            display: block;
            padding: 10px 16px;
            border-radius: var(--radius-md);
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            transition: var(--transition-fast);
            cursor: pointer;
            border: none;
            font-family: var(--font-body);
            background: transparent;
          }

          .account-link--primary {
            background: var(--color-primary);
            color: #fff;
          }

          .account-link--primary:hover { background: var(--color-primary-light); }

          .account-link:not(.account-link--primary) {
            border: 1px solid var(--color-border);
            color: var(--color-text-secondary);
          }

          .account-link:not(.account-link--primary):hover {
            border-color: var(--color-accent);
            color: var(--color-accent);
          }

          .account-divider {
            height: 1px;
            background: var(--color-border);
          }

          .account-menu {
            padding: 6px 8px;
          }

          :global(.account-menu-item) {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            font-size: 13px;
            color: var(--color-text-secondary);
            border-radius: var(--radius-md);
            transition: background 0.15s, color 0.15s;
          }

          :global(.account-menu-item:hover) {
            background: var(--color-bg-alt);
            color: var(--color-primary);
          }

          .menu-count {
            margin-left: auto;
            background: var(--color-accent);
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            min-width: 18px;
            height: 18px;
            padding: 0 4px;
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logout-item {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 12px 20px;
            border: none;
            background: transparent;
            font-size: 13px;
            color: var(--color-text-muted);
            cursor: pointer;
            font-family: var(--font-body);
            transition: color 0.2s, background 0.2s;
            text-align: left;
          }

          .logout-item:hover {
            color: var(--color-sale);
            background: rgba(196, 75, 122, 0.05);
          }

          /* Mobile */
          .mobile-menu { display: none; }

          @media (max-width: 768px) {
            .desktop-nav { display: none; }
            .mobile-menu { display: flex; }
            .header-inner { height: 60px; }
            :global(.logo) { font-size: 22px; }
          }
        `}</style>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-overlay">
          <div className="mobile-panel">
            <div className="mobile-top">
              <span className="mobile-logo">Lemini</span>
              <button
                className="mobile-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="mobile-nav">
              <Link href="/products" className="mobile-link" onClick={() => setMobileOpen(false)}>
                Sản Phẩm
              </Link>

              <div className="mobile-section">
                <Link href="/collections" className="mobile-link" onClick={() => setMobileOpen(false)}>
                  Bộ Sưu Tập
                </Link>
                <div className="mobile-sub">
                  {mockCategories.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/collections/${cat.slug}`}
                      className="mobile-sub-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href="/blog" className="mobile-link" onClick={() => setMobileOpen(false)}>
                Blog
              </Link>
              <Link href="/about" className="mobile-link" onClick={() => setMobileOpen(false)}>
                Về Chúng Tôi
              </Link>
              <Link href="/faq" className="mobile-link" onClick={() => setMobileOpen(false)}>
                Câu Hỏi Thường Gặp
              </Link>
              <Link href="/contact" className="mobile-link" onClick={() => setMobileOpen(false)}>
                Liên Hệ
              </Link>
            </nav>

            {/* Mobile account links */}
            <div className="mobile-auth">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/account"
                    className="mobile-auth-btn mobile-auth-btn--primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    Tài khoản của tôi
                  </Link>
                  <button
                    className="mobile-auth-btn"
                    onClick={() => { logout(); setMobileOpen(false); }}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="mobile-auth-btn mobile-auth-btn--primary"
                    onClick={() => { openAuthModal('login'); setMobileOpen(false); }}
                  >
                    Đăng nhập
                  </button>
                  <button
                    className="mobile-auth-btn"
                    onClick={() => { openAuthModal('register'); setMobileOpen(false); }}
                  >
                    Tạo tài khoản
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />

          <style jsx>{`
            .mobile-overlay {
              position: fixed;
              inset: 0;
              z-index: 200;
              display: flex;
            }

            .mobile-backdrop {
              flex: 1;
              background: rgba(46, 26, 74, 0.4);
              backdrop-filter: blur(2px);
            }

            .mobile-panel {
              width: 300px;
              background: var(--color-surface);
              height: 100%;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              animation: slideIn 0.25s ease;
            }

            @keyframes slideIn {
              from { transform: translateX(-100%); }
              to   { transform: translateX(0); }
            }

            .mobile-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 20px 24px;
              border-bottom: 1px solid var(--color-border);
            }

            .mobile-logo {
              font-family: var(--font-display);
              font-size: 22px;
              font-weight: 500;
              color: var(--color-primary);
            }

            .mobile-close {
              background: none;
              border: none;
              cursor: pointer;
              color: var(--color-text);
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              transition: background 0.2s;
            }

            .mobile-close:hover { background: var(--color-bg-alt); }

            .mobile-nav {
              display: flex;
              flex-direction: column;
              flex: 1;
            }

            :global(.mobile-link) {
              padding: 14px 24px;
              font-size: 15px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: var(--color-text);
              border-bottom: 1px solid var(--color-border);
              transition: color 0.2s, background 0.2s;
              display: block;
            }

            :global(.mobile-link:hover) {
              color: var(--color-primary);
              background: var(--color-bg-alt);
            }

            .mobile-section { border-bottom: 1px solid var(--color-border); }

            .mobile-sub {
              padding: 4px 0 8px 16px;
              background: var(--color-bg-alt);
            }

            :global(.mobile-sub-link) {
              display: block;
              padding: 10px 24px;
              font-size: 14px;
              color: var(--color-text-secondary);
              transition: color 0.2s;
            }

            :global(.mobile-sub-link:hover) { color: var(--color-primary); }

            .mobile-auth {
              display: flex;
              flex-direction: column;
              gap: 10px;
              padding: 20px 24px;
              border-top: 1px solid var(--color-border);
              margin-top: auto;
            }

            .mobile-auth-btn {
              display: block;
              width: 100%;
              padding: 12px;
              border: none;
              background: transparent;
              cursor: pointer;
              font-family: var(--font-body);
              border-radius: var(--radius-full);
              font-size: 14px;
              font-weight: 600;
              text-align: center;
              transition: var(--transition-fast);
            }

            .mobile-auth-btn--primary {
              background: var(--color-primary);
              color: #fff;
            }

            .mobile-auth-btn--primary:hover { background: var(--color-primary-light); }

            .mobile-auth-btn:not(.mobile-auth-btn--primary) {
              border: 1px solid var(--color-border);
              color: var(--color-text-secondary);
            }
          `}</style>
        </div>
      )}

      {/* Portals */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
