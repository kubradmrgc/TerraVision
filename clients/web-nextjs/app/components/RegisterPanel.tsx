'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toCustomerRegisterRequest, validateRegisterForm } from '@terravision/shared';
import { authService } from '@/services/authService';
import { WEB_REGISTER_PANEL } from '@/config/registerPanel';
import { getApiErrorMessage } from '@/utils/apiError';

export function RegisterPanel() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateRegisterForm({
      firstName,
      lastName,
      email,
      password,
      confirmPassword
    });
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    try {
      await authService.register(
        toCustomerRegisterRequest({ firstName, lastName, email, password, confirmPassword })
      );
      router.push(WEB_REGISTER_PANEL.redirectPath);
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Kayıt tamamlanamadı. Bilgilerinizi kontrol edip tekrar deneyin.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tv-login-wrap">
      <Link href="/" className="tv-login-back">
        ← Ana sayfaya dön
      </Link>

      <div className="tv-login-card">
        <span className="tv-login-pill">{WEB_REGISTER_PANEL.pill}</span>
        <h1 className="tv-login-title">{WEB_REGISTER_PANEL.title}</h1>
        <p className="tv-login-subtitle">{WEB_REGISTER_PANEL.subtitle}</p>

        <form onSubmit={handleSubmit} className="tv-form">
          <div className="tv-field">
            <label htmlFor="register-first-name">Ad</label>
            <input
              id="register-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
              placeholder="Adınız"
            />
          </div>
          <div className="tv-field">
            <label htmlFor="register-last-name">Soyad</label>
            <input
              id="register-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
              placeholder="Soyadınız"
            />
          </div>
          <div className="tv-field">
            <label htmlFor="register-email">E-posta</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="ornek@terravision.com"
            />
          </div>
          <div className="tv-field">
            <label htmlFor="register-password">Şifre</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="En az 8 karakter"
              minLength={8}
            />
          </div>
          <div className="tv-field">
            <label htmlFor="register-confirm-password">Şifre (tekrar)</label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Şifrenizi tekrar girin"
              minLength={8}
            />
          </div>
          {error ? <p className="tv-error">{error}</p> : null}
          <button type="submit" disabled={loading} className="tv-submit">
            {loading ? 'Hesap oluşturuluyor…' : WEB_REGISTER_PANEL.submitLabel}
          </button>
        </form>

        <p className="tv-login-switch">
          Zaten hesabınız var mı?{' '}
          <Link href={WEB_REGISTER_PANEL.loginHref}>Giriş yapın</Link>
        </p>
      </div>
    </div>
  );
}
