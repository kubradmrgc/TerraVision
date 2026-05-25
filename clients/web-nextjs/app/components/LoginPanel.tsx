'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoginPortal, roleMatchesPortal, portalRoleMismatchMessage } from '@terravision/shared';
import { authService } from '@/services/authService';
import { WEB_LOGIN_PANELS } from '@/config/loginPanels';
import { getApiErrorMessage } from '@/utils/apiError';

type Props = {
  portal: LoginPortal;
};

export function LoginPanel({ portal }: Props) {
  const router = useRouter();
  const config = WEB_LOGIN_PANELS[portal];
  const [email, setEmail] = useState(config.defaultEmail ?? '');
  const [password, setPassword] = useState(config.defaultPassword ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await authService.login({ email, password });
      if (!roleMatchesPortal(auth.role, portal)) {
        await authService.logout();
        setError(portalRoleMismatchMessage(portal));
        return;
      }
      router.push(config.redirectPath);
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Giriş başarısız. E-posta veya şifreyi kontrol edin.')
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
        <span className="tv-login-pill">{config.pill}</span>
        <h1 className="tv-login-title">{config.title}</h1>
        <p className="tv-login-subtitle">{config.subtitle}</p>

        <form onSubmit={handleSubmit} className="tv-form">
          <div className="tv-field">
            <label htmlFor={`email-${portal}`}>E-posta</label>
            <input
              id={`email-${portal}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="ornek@terravision.com"
            />
          </div>
          <div className="tv-field">
            <label htmlFor={`password-${portal}`}>Şifre</label>
            <input
              id={`password-${portal}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          {error ? <p className="tv-error">{error}</p> : null}
          <button type="submit" disabled={loading} className="tv-submit">
            {loading ? 'Giriş yapılıyor…' : config.submitLabel}
          </button>
        </form>

        {portal !== 'customer' && config.alternateLinks.length > 0 ? (
          <div className="tv-login-alt">
            <p className="tv-login-alt-label">Farklı hesap türü</p>
            <div className="tv-login-alt-links">
              {config.alternateLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
