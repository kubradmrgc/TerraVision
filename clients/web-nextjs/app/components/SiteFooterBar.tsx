'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  channelByKey,
  siteSupportService,
  type SiteContactChannel,
  type SiteFeedbackKind
} from '@/services/siteSupportService';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAuthSession } from '@/hooks/useAuthSession';
import { authService } from '@/services/authService';

const USER_STORY_PLACEHOLDER =
  'Ziyaretçi olarak, [sorunu yazın], böylece [beklediğiniz sonuç].';

export function SiteFooterBar(): React.JSX.Element | null {
  const pathname = usePathname();
  const { ready, isAuthenticated } = useAuthSession();
  const [channels, setChannels] = useState<SiteContactChannel[]>([]);
  const [hint, setHint] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [userStory, setUserStory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const isAdminRoute = pathname.startsWith('/admin');

  const loadFooter = useCallback(async () => {
    try {
      const footer = await siteSupportService.getFooter();
      setChannels(footer.channels);
      setHint(footer.userStoryHint);
    } catch {
      setChannels([]);
    }
  }, []);

  useEffect(() => {
    if (!isAdminRoute) {
      void loadFooter();
    }
  }, [isAdminRoute, loadFooter]);

  useEffect(() => {
    if (ready && isAuthenticated && !formEmail) {
      const profileEmail = authService.getProfile()?.email;
      if (profileEmail) {
        setFormEmail(profileEmail);
      }
    }
  }, [ready, isAuthenticated, formEmail]);

  if (isAdminRoute) {
    return null;
  }

  const support = channelByKey(channels, 'support');
  const contact = channelByKey(channels, 'contact');
  const info = channelByKey(channels, 'info');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmedStory = userStory.trim();
    if (trimmedStory.length < 20) {
      setError('User story en az 20 karakter olmalıdır.');
      return;
    }
    setSubmitting(true);
    try {
      await siteSupportService.submitFeedback({
        email: formEmail.trim(),
        userStory: trimmedStory,
        kind: 'websiteIssue' satisfies SiteFeedbackKind,
        pageUrl: typeof window !== 'undefined' ? window.location.href : pathname
      });
      setUserStory('');
      setSuccess('Geri bildiriminiz kaydedildi. Teşekkürler!');
      setExpanded(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gönderilemedi. Lütfen tekrar deneyin.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="tv-site-footer" aria-label="Destek ve iletişim">
      <div className="tv-site-footer-bar">
        <section className="tv-site-footer-col" aria-labelledby="tv-footer-issues">
          <h2 id="tv-footer-issues" className="tv-site-footer-heading">
            Sorunlar
          </h2>
          <p className="tv-site-footer-lead">Web sitesiyle ilgili sorunu user story olarak bildirin.</p>
          {!expanded ? (
            <button type="button" className="tv-btn tv-btn--primary tv-site-footer-cta" onClick={() => setExpanded(true)}>
              Sorun bildir
            </button>
          ) : (
            <form className="tv-site-footer-form" onSubmit={(e) => void handleSubmit(e)}>
              <label className="tv-site-footer-label" htmlFor="tv-feedback-email">
                E-posta
              </label>
              <input
                id="tv-feedback-email"
                type="email"
                className="tv-input"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <label className="tv-site-footer-label" htmlFor="tv-feedback-story">
                User story
              </label>
              <textarea
                id="tv-feedback-story"
                className="tv-input tv-site-footer-textarea"
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder={USER_STORY_PLACEHOLDER}
                required
                minLength={20}
                maxLength={2000}
                rows={4}
                aria-describedby="tv-feedback-hint"
              />
              {hint ? (
                <p id="tv-feedback-hint" className="tv-muted tv-site-footer-hint">
                  {hint}
                </p>
              ) : null}
              <div className="tv-site-footer-form-actions">
                <button type="submit" className="tv-btn tv-btn--primary" disabled={submitting}>
                  {submitting ? 'Gönderiliyor…' : 'Gönder'}
                </button>
                <button
                  type="button"
                  className="tv-btn"
                  disabled={submitting}
                  onClick={() => {
                    setExpanded(false);
                    setError(null);
                  }}
                >
                  Kapat
                </button>
              </div>
            </form>
          )}
          {error ? (
            <p className="tv-error" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="tv-success" role="status">
              {success}
            </p>
          ) : null}
        </section>

        <section className="tv-site-footer-col" aria-labelledby="tv-footer-support">
          <h2 id="tv-footer-support" className="tv-site-footer-heading">
            Destek
          </h2>
          {support ? (
            <>
              <p className="tv-site-footer-lead">{support.label}</p>
              <a className="tv-site-footer-mail" href={`mailto:${support.email}`}>
                {support.email}
              </a>
            </>
          ) : (
            <p className="tv-muted">Destek e-postası yükleniyor…</p>
          )}
        </section>

        <section className="tv-site-footer-col" aria-labelledby="tv-footer-contact">
          <h2 id="tv-footer-contact" className="tv-site-footer-heading">
            İletişim
          </h2>
          {contact ? (
            <>
              <p className="tv-site-footer-lead">{contact.label}</p>
              <a className="tv-site-footer-mail" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </>
          ) : (
            <p className="tv-muted">İletişim bilgisi yükleniyor…</p>
          )}
        </section>
      </div>

      <div className="tv-site-footer-ends">
        <nav className="tv-site-footer-ends-nav" aria-label="Site sonları">
          <Link href="/products">Ürünler</Link>
          <Link href="/marketplace">TerraTakas</Link>
          <Link href="/">Ana sayfa</Link>
          {info ? (
            <a href={`mailto:${info.email}`}>{info.label}</a>
          ) : null}
        </nav>
        <p className="tv-site-footer-copy">© {new Date().getFullYear()} TerraVision — Bitki ve bahçe platformu</p>
      </div>
    </footer>
  );
}
