'use client';

import { useEffect, useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type View = 'login' | 'register' | 'forgot';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2045c0-.638-.0573-1.252-.164-1.8405H9v3.4815h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9086C16.6582 14.1964 17.64 11.9345 17.64 9.2045z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.4673-.8063 5.9564-2.1814l-2.9086-2.2581c-.8063.54-1.8368.8591-3.0477.8591-2.344 0-4.3282-1.5836-5.036-3.71H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71C3.7836 10.17 3.6818 9.5945 3.6818 9s.1018-1.17.2822-1.71V4.9582H.9574C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9574 4.0418L3.964 10.71z" fill="#FBBC05"/>
    <path d="M9 3.5795c1.3214 0 2.5077.4545 3.4405 1.346l2.5813-2.5814C13.4627.8918 11.4254 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1636 6.656 3.5795 9 3.5795z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function AuthModal() {
  const { authModalOpen, authModalView, closeAuthModal, login, loginWithOAuth, register } = useAuth();
  const [view, setView] = useState<View>(authModalView);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => setView(authModalView), [authModalView]);

  useEffect(() => {
    setError('');
    setSuccess('');
    setLoading(false);
    setOauthLoading(null);
    setShowPass(false);
    setShowConfirm(false);
  }, [view]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuthModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeAuthModal]);

  useEffect(() => {
    document.body.style.overflow = authModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const isAnyLoading = loading || oauthLoading !== null;

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    setLoading(true);
    setError('');
    const res = await login(email, password);
    if (!res.ok) { setError(res.error || 'Lỗi đăng nhập'); setLoading(false); }
  };

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value;
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await register(name, email, password);
    if (!res.ok) { setError(res.error || 'Lỗi đăng ký'); setLoading(false); }
  };

  const handleForgot = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSuccess('Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư!');
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider);
    setError('');
    const res = await loginWithOAuth(provider);
    if (!res.ok) { setError(res.error || 'Đăng nhập thất bại. Vui lòng thử lại.'); setOauthLoading(null); }
  };

  return (
    <div className="overlay">
      <div className="backdrop" onClick={closeAuthModal} />
      <div className="modal" role="dialog" aria-modal="true">
        <button className="close-btn" onClick={closeAuthModal} aria-label="Đóng" disabled={isAnyLoading}>
          <X size={20} />
        </button>

        <div className="modal-logo">Lemini</div>

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <>
            <h2 className="modal-title">Chào mừng trở lại</h2>
            <p className="modal-sub">Đăng nhập để xem đơn hàng và sản phẩm yêu thích.</p>

            <div className="social-btns">
              <button
                className="social-btn social-btn--google"
                onClick={() => handleOAuth('google')}
                disabled={isAnyLoading}
              >
                {oauthLoading === 'google'
                  ? <Loader2 size={16} className="spin" />
                  : <GoogleIcon />}
                Tiếp tục với Google
              </button>
              <button
                className="social-btn social-btn--fb"
                onClick={() => handleOAuth('facebook')}
                disabled={isAnyLoading}
              >
                {oauthLoading === 'facebook'
                  ? <Loader2 size={16} className="spin" />
                  : <FacebookIcon />}
                Tiếp tục với Facebook
              </button>
            </div>

            <div className="divider"><span>hoặc đăng nhập bằng email</span></div>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="field">
                <label className="field-label">Email</label>
                <input name="email" type="email" className="field-input" placeholder="email@example.com" required disabled={isAnyLoading} />
              </div>
              <div className="field">
                <label className="field-label">Mật khẩu</label>
                <div className="input-wrap">
                  <input name="password" type={showPass ? 'text' : 'password'} className="field-input" placeholder="••••••••" required disabled={isAnyLoading} />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="button" className="forgot-link" onClick={() => setView('forgot')}>Quên mật khẩu?</button>
              {error && <p className="error-msg">{error}</p>}
              <button type="submit" className="submit-btn" disabled={isAnyLoading}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Đăng nhập'}
              </button>
            </form>
            <p className="switch-text">
              Chưa có tài khoản?{' '}
              <button className="switch-link" onClick={() => setView('register')}>Đăng ký ngay</button>
            </p>
          </>
        )}

        {/* ── REGISTER ── */}
        {view === 'register' && (
          <>
            <h2 className="modal-title">Tạo tài khoản</h2>
            <p className="modal-sub">Nhận ưu đãi độc quyền cho thành viên mới.</p>

            <div className="social-btns">
              <button
                className="social-btn social-btn--google"
                onClick={() => handleOAuth('google')}
                disabled={isAnyLoading}
              >
                {oauthLoading === 'google'
                  ? <Loader2 size={16} className="spin" />
                  : <GoogleIcon />}
                Tiếp tục với Google
              </button>
              <button
                className="social-btn social-btn--fb"
                onClick={() => handleOAuth('facebook')}
                disabled={isAnyLoading}
              >
                {oauthLoading === 'facebook'
                  ? <Loader2 size={16} className="spin" />
                  : <FacebookIcon />}
                Tiếp tục với Facebook
              </button>
            </div>

            <div className="divider"><span>hoặc đăng ký bằng email</span></div>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="field">
                <label className="field-label">Họ và tên</label>
                <input name="name" type="text" className="field-input" placeholder="Nguyễn Thị Lan" required disabled={isAnyLoading} />
              </div>
              <div className="field">
                <label className="field-label">Email</label>
                <input name="email" type="email" className="field-input" placeholder="email@example.com" required disabled={isAnyLoading} />
              </div>
              <div className="field">
                <label className="field-label">Mật khẩu</label>
                <div className="input-wrap">
                  <input name="password" type={showPass ? 'text' : 'password'} className="field-input" placeholder="Tối thiểu 6 ký tự" required minLength={6} disabled={isAnyLoading} />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Xác nhận mật khẩu</label>
                <div className="input-wrap">
                  <input name="confirm" type={showConfirm ? 'text' : 'password'} className="field-input" placeholder="Nhập lại mật khẩu" required minLength={6} disabled={isAnyLoading} />
                  <button type="button" className="eye-btn" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button type="submit" className="submit-btn" disabled={isAnyLoading}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Tạo tài khoản'}
              </button>
            </form>
            <p className="switch-text">
              Đã có tài khoản?{' '}
              <button className="switch-link" onClick={() => setView('login')}>Đăng nhập</button>
            </p>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === 'forgot' && (
          <>
            <h2 className="modal-title">Quên mật khẩu</h2>
            <p className="modal-sub">Nhập email để nhận link đặt lại mật khẩu.</p>

            {!success ? (
              <form className="auth-form" onSubmit={handleForgot}>
                <div className="field">
                  <label className="field-label">Email đã đăng ký</label>
                  <input name="email" type="email" className="field-input" placeholder="email@example.com" required disabled={loading} />
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <Loader2 size={18} className="spin" /> : 'Gửi email đặt lại'}
                </button>
              </form>
            ) : (
              <div className="success-box">
                <span className="success-icon">✅</span>
                <p className="success-text">{success}</p>
              </div>
            )}
            <p className="switch-text">
              <button className="switch-link" onClick={() => setView('login')}>← Quay lại đăng nhập</button>
            </p>
          </>
        )}
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 400;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .backdrop {
          position: absolute;
          inset: 0;
          background: rgba(46, 26, 74, 0.55);
          backdrop-filter: blur(4px);
        }

        .modal {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          padding: 40px 36px 36px;
          box-shadow: 0 24px 64px rgba(46, 26, 74, 0.2);
          animation: popIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 92vh;
          overflow-y: auto;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }

        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          transition: background 0.2s;
        }

        .close-btn:hover:not(:disabled) { background: var(--color-bg-alt); }
        .close-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .modal-logo {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 500;
          color: var(--color-primary);
          text-align: center;
          margin-bottom: 20px;
        }

        .modal-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 500;
          color: var(--color-primary);
          text-align: center;
          margin-bottom: 6px;
        }

        .modal-sub {
          font-size: 14px;
          color: var(--color-text-muted);
          text-align: center;
          margin-bottom: 24px;
        }

        .social-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 44px;
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-fast);
          font-family: var(--font-body);
        }

        .social-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .social-btn--google {
          background: #fff;
          border: 1px solid var(--color-border);
          color: var(--color-text);
          box-shadow: var(--shadow-sm);
        }

        .social-btn--google:hover:not(:disabled) { box-shadow: var(--shadow-md); }

        .social-btn--fb {
          background: #1877F2;
          border: none;
          color: #fff;
        }

        .social-btn--fb:hover:not(:disabled) { background: #166FE5; }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: var(--color-text-muted);
          font-size: 12px;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .field-input {
          height: 44px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0 14px;
          font-size: 14px;
          font-family: var(--font-body);
          color: var(--color-text);
          background: var(--color-bg);
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }

        .field-input:focus { border-color: var(--color-accent); }
        .field-input:disabled { opacity: 0.6; cursor: not-allowed; }

        .input-wrap { position: relative; }
        .input-wrap .field-input { padding-right: 44px; }

        .eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
        }

        .forgot-link {
          background: none;
          border: none;
          font-size: 13px;
          color: var(--color-accent);
          cursor: pointer;
          text-align: right;
          font-family: var(--font-body);
          margin-top: -8px;
        }

        .forgot-link:hover { text-decoration: underline; }

        .error-msg {
          font-size: 13px;
          color: var(--color-sale);
          background: rgba(196, 75, 122, 0.08);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          border-left: 3px solid var(--color-sale);
        }

        .submit-btn {
          height: 48px;
          background: var(--color-primary);
          color: #fff;
          border: none;
          border-radius: var(--radius-full);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: var(--transition-fast);
          font-family: var(--font-body);
          margin-top: 4px;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--color-primary-light);
          transform: translateY(-1px);
        }

        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        :global(.spin) { animation: spin 0.8s linear infinite; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .switch-text {
          text-align: center;
          font-size: 13px;
          color: var(--color-text-muted);
          margin-top: 20px;
        }

        .switch-link {
          background: none;
          border: none;
          font-size: 13px;
          color: var(--color-accent);
          cursor: pointer;
          font-weight: 600;
          font-family: var(--font-body);
        }

        .switch-link:hover { text-decoration: underline; }

        .success-box {
          text-align: center;
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .success-icon { font-size: 40px; }

        .success-text {
          font-size: 14px;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
