'use client';

import { useState, useRef } from 'react';
import { Camera, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savePw, setSavePw] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedPw, setSavedPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = user!.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Ảnh tối đa 2MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => updateProfile({ avatar: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleProfile = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
    const address = (form.elements.namedItem('address') as HTMLInputElement).value;
    setSaving(true);
    await updateProfile({ name, phone, address });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const current = (form.elements.namedItem('current') as HTMLInputElement).value;
    const next = (form.elements.namedItem('next') as HTMLInputElement).value;
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value;
    if (next !== confirm) { setPwError('Mật khẩu xác nhận không khớp.'); return; }
    if (next.length < 6) { setPwError('Mật khẩu mới tối thiểu 6 ký tự.'); return; }
    setSavePw(true);
    setPwError('');
    const res = await changePassword(current, next);
    setSavePw(false);
    if (!res.ok) { setPwError(res.error ?? 'Lỗi'); return; }
    setSavedPw(true);
    form.reset();
    setTimeout(() => setSavedPw(false), 2500);
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">Hồ sơ cá nhân</h1>
        <p className="page-sub">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="profile-body">
        {/* Avatar section */}
        <div className="avatar-section">
          <div className="avatar-wrap">
            <div className="avatar">
              {user!.avatar
                ? <img src={user!.avatar} alt="avatar" className="avatar-img" />
                : initials}
            </div>
            <button className="avatar-edit" aria-label="Thay ảnh" onClick={() => fileInputRef.current?.click()}>
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <div className="avatar-info">
            <p className="avatar-name">{user!.name}</p>
            <p className="avatar-email">{user!.email}</p>
            <p className="avatar-hint">Ảnh đại diện tối đa 2MB, định dạng JPG/PNG/WebP</p>
          </div>
        </div>

        {/* Profile form */}
        <div className="form-section">
          <h2 className="form-title">Thông tin cá nhân</h2>
          <form className="profile-form" onSubmit={handleProfile}>
            <div className="field-grid">
              <div className="field">
                <label className="field-label">Họ và tên</label>
                <input name="name" type="text" className="field-input" defaultValue={user!.name} required />
              </div>
              <div className="field">
                <label className="field-label">Email</label>
                <input type="email" className="field-input field-input--disabled" value={user!.email} disabled />
                <p className="field-hint">Email không thể thay đổi</p>
              </div>
              <div className="field">
                <label className="field-label">Số điện thoại</label>
                <input name="phone" type="tel" className="field-input" defaultValue={user!.phone ?? ''} placeholder="0912 345 678" />
              </div>
              <div className="field field--full">
                <label className="field-label">Địa chỉ giao hàng</label>
                <textarea name="address" className="field-input field-textarea" defaultValue={user!.address ?? ''} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" rows={2} />
              </div>
            </div>

            <div className="form-actions">
              {saved && (
                <span className="save-success">
                  <Check size={15} /> Đã lưu thành công
                </span>
              )}
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>

        {/* Password form */}
        <div className="form-section">
          <h2 className="form-title">Đổi mật khẩu</h2>
          <p className="form-sub">Sử dụng mật khẩu mạnh kết hợp chữ, số và ký tự đặc biệt.</p>
          <form className="profile-form" onSubmit={handlePassword}>
            <div className="field">
              <label className="field-label">Mật khẩu hiện tại</label>
              <div className="input-wrap">
                <input name="current" type={showCurrent ? 'text' : 'password'} className="field-input" placeholder="••••••••" required />
                <button type="button" className="eye-btn" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="field-label">Mật khẩu mới</label>
                <div className="input-wrap">
                  <input name="next" type={showNew ? 'text' : 'password'} className="field-input" placeholder="Tối thiểu 6 ký tự" required />
                  <button type="button" className="eye-btn" onClick={() => setShowNew(v => !v)}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Xác nhận mật khẩu mới</label>
                <input name="confirm" type="password" className="field-input" placeholder="Nhập lại mật khẩu mới" required />
              </div>
            </div>

            {pwError && <p className="error-msg">{pwError}</p>}

            <div className="form-actions">
              {savedPw && (
                <span className="save-success">
                  <Check size={15} /> Đổi mật khẩu thành công
                </span>
              )}
              <button type="submit" className="save-btn" disabled={savePw}>
                {savePw ? <Loader2 size={16} className="spin" /> : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .profile-page { padding: 0; }

        .page-header {
          padding: 28px 32px 24px;
          border-bottom: 1px solid var(--color-border);
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 500;
          color: var(--color-primary);
        }

        .page-sub {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-top: 4px;
        }

        .profile-body {
          padding: 28px 32px 40px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* Avatar */
        .avatar-section {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 20px 24px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg-alt);
        }

        .avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: #fff;
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 600;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #fff;
          box-shadow: var(--shadow-md);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .avatar-edit {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-primary);
          color: #fff;
          border: 2px solid #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .avatar-edit:hover { background: var(--color-accent); }

        .avatar-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-primary);
          font-family: var(--font-display);
        }

        .avatar-email {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 4px 0 8px;
        }

        .avatar-hint {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        /* Form section */
        .form-section {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 24px;
          background: var(--color-bg);
        }

        .form-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 500;
          color: var(--color-primary);
          margin-bottom: 4px;
        }

        .form-sub {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 20px;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 20px;
        }

        .field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field--full { grid-column: 1 / -1; }

        .field-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .field-hint {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .field-input {
          height: 44px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0 14px;
          font-size: 14px;
          font-family: var(--font-body);
          color: var(--color-text);
          background: var(--color-surface);
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }

        .field-input:focus { border-color: var(--color-accent); }

        .field-input--disabled {
          background: var(--color-bg-alt);
          color: var(--color-text-muted);
          cursor: not-allowed;
        }

        .field-textarea {
          height: auto;
          padding: 10px 14px;
          resize: none;
          line-height: 1.5;
        }

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

        .error-msg {
          font-size: 13px;
          color: var(--color-sale);
          background: rgba(196, 75, 122, 0.08);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          border-left: 3px solid var(--color-sale);
        }

        .form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 8px;
          border-top: 1px solid var(--color-border);
        }

        .save-success {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #22C55E;
          font-weight: 600;
        }

        .save-btn {
          height: 44px;
          padding: 0 28px;
          background: var(--color-primary);
          color: #fff;
          border: none;
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-body);
          transition: var(--transition-fast);
        }

        .save-btn:hover:not(:disabled) {
          background: var(--color-primary-light);
          transform: translateY(-1px);
        }

        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        :global(.spin) { animation: spin 0.8s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .profile-body { padding: 16px; }
          .avatar-section { flex-direction: column; text-align: center; }
          .field-grid { grid-template-columns: 1fr; }
          .form-section { padding: 16px; }
        }
      `}</style>
    </div>
  );
}
