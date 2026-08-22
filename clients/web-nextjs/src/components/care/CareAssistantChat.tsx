'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  CARE_ASSISTANT_PROMPTS,
  CareAssistantHistoryMessage,
  CareCatalogPlantDto
} from '@terravision/shared';
import { careService } from '@/services/careService';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && typeof err.response?.data === 'object' && err.response.data !== null) {
    const message = (err.response.data as { message?: string }).message;
    if (message) return message;
  }
  return 'Asistan yanıt veremedi. Lütfen tekrar deneyin.';
}

function modeLabel(mode: string): string {
  return mode === 'llm' ? 'Yapay zeka' : 'Yerel özet';
}

type Props = {
  catalog?: CareCatalogPlantDto[];
};

export function CareAssistantChat({ catalog: catalogProp }: Props) {
  const [catalog, setCatalog] = useState<CareCatalogPlantDto[]>(catalogProp ?? []);
  const [focusProductId, setFocusProductId] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Merhaba! Bahçenizdeki bitkiler veya mağaza kataloğundaki türler hakkında satın almadan bakım sorusu sorabilirsiniz.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (catalogProp) {
      setCatalog(catalogProp);
      return;
    }
    void careService.getCatalogPlants().then(setCatalog).catch(() => undefined);
  }, [catalogProp]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      setInput('');
      const userMessage: ChatMessage = { role: 'user', content: trimmed };
      const history: CareAssistantHistoryMessage[] = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await careService.assistantChat({
          message: trimmed,
          history,
          productId: focusProductId
        });
        setMessages((prev) => [...prev, { role: 'assistant', content: response.reply }]);
        setLastMode(response.mode);
        setDisclaimer(response.disclaimer);
        requestAnimationFrame(scrollToBottom);
      } catch (err) {
        setError(extractErrorMessage(err));
        setMessages((prev) => prev.slice(0, -1));
        setInput(trimmed);
      } finally {
        setLoading(false);
      }
    },
    [focusProductId, loading, messages, scrollToBottom]
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <section className="tv-care-assistant" aria-labelledby="care-assistant-title">
      <div className="tv-care-assistant-header">
        <h2 id="care-assistant-title" className="tv-subsection-title">
          Bakım asistanı
        </h2>
        {lastMode ? (
          <span className="tv-care-assistant-mode" title="Son yanıtın kaynağı">
            {modeLabel(lastMode)}
          </span>
        ) : null}
      </div>
      <p className="tv-muted tv-care-assistant-lead">
        Takviminize veya mağaza kataloğuna göre bakım önerisi alın — satın alma gerekmez.
      </p>

      {catalog.length > 0 ? (
        <div className="tv-care-assistant-focus">
          <label htmlFor="care-assistant-plant">Katalog bitkisi (opsiyonel)</label>
          <select
            id="care-assistant-plant"
            value={focusProductId ?? ''}
            disabled={loading}
            onChange={(e) => setFocusProductId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Tümü / mesajdan tahmin</option>
            {catalog.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="tv-care-assistant-prompts" role="group" aria-label="Örnek sorular">
        {CARE_ASSISTANT_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="tv-care-assistant-chip"
            disabled={loading}
            onClick={() => void sendMessage(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div ref={listRef} className="tv-care-assistant-messages" role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`tv-care-assistant-bubble tv-care-assistant-bubble--${msg.role}`}
          >
            <span className="tv-care-assistant-bubble-label">
              {msg.role === 'user' ? 'Siz' : 'Asistan'}
            </span>
            <p>{msg.content}</p>
          </div>
        ))}
        {loading ? (
          <p className="tv-muted tv-care-assistant-typing">Yanıt hazırlanıyor…</p>
        ) : null}
      </div>

      {error ? (
        <p className="tv-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="tv-care-assistant-form" onSubmit={handleSubmit}>
        <textarea
          id="care-assistant-input"
          aria-label="Asistana mesaj yazın"
          className="tv-care-assistant-input"
          rows={2}
          value={input}
          disabled={loading}
          placeholder="Örn: Monstera’mı ne zaman sulamalıyım?"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void sendMessage(input);
            }
          }}
        />
        <button type="submit" className="tv-btn tv-btn--primary" disabled={loading || !input.trim()}>
          {loading ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </form>

      {disclaimer ? <p className="tv-care-assistant-disclaimer">{disclaimer}</p> : null}
    </section>
  );
}
