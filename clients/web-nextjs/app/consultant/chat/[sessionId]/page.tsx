'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChatMessageDto,
  ChatMessageKind,
  ConsultationSessionDto
} from '@terravision/shared';
import { ChatProposalComposer } from '@/components/chat/ChatProposalComposer';
import { ProposalCard } from '@/components/chat/ProposalCard';
import { chatService } from '@/services/chatService';
import { realtimeService } from '@/services/realtimeService';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getApiErrorMessage } from '@/utils/apiError';

function appendMessage(messages: ChatMessageDto[], incoming: ChatMessageDto): ChatMessageDto[] {
  if (messages.some((m) => m.id === incoming.id)) {
    return messages;
  }
  return [...messages, incoming];
}

export default function ConsultantChatSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = Number(params.sessionId);
  const router = useRouter();
  const { ready, isAuthenticated, isConsultant } = useAuthSession();
  const [session, setSession] = useState<ConsultationSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const loadChat = useCallback(async () => {
    if (!Number.isFinite(sessionId)) {
      setError('Geçersiz sohbet oturumu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [sessionData, messageData] = await Promise.all([
        chatService.getSession(sessionId),
        chatService.getMessages(sessionId)
      ]);
      setSession(sessionData);
      setMessages(messageData);
      requestAnimationFrame(scrollToBottom);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sohbet yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, [sessionId, scrollToBottom]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!isAuthenticated) {
      router.replace('/login/consultant');
      return;
    }
    if (!isConsultant) {
      router.replace('/products');
      return;
    }
    void loadChat();
  }, [ready, isAuthenticated, isConsultant, router, loadChat]);

  useEffect(() => {
    if (!ready || !isAuthenticated || !isConsultant || !Number.isFinite(sessionId)) {
      return;
    }

    let disposed = false;

    const setup = async () => {
      try {
        await realtimeService.connect();
        await realtimeService.joinChatSession(sessionId);
        if (disposed) {
          return;
        }

        const unsubscribe = realtimeService.onChatMessageReceived((event) => {
          if (event.message.sessionId !== sessionId) {
            return;
          }
          setMessages((prev) => appendMessage(prev, event.message));
          requestAnimationFrame(scrollToBottom);
        });

        return unsubscribe;
      } catch {
        return undefined;
      }
    };

    let unsubscribe: (() => void) | undefined;
    void setup().then((fn) => {
      unsubscribe = fn;
    });

    return () => {
      disposed = true;
      unsubscribe?.();
      void realtimeService.leaveChatSession(sessionId);
    };
  }, [ready, isAuthenticated, isConsultant, sessionId, scrollToBottom]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) {
      return;
    }

    setSending(true);
    setError(null);
    setInput('');

    try {
      const message = await chatService.sendMessage(sessionId, { content: trimmed });
      setMessages((prev) => appendMessage(prev, message));
      requestAnimationFrame(scrollToBottom);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Mesaj gönderilemedi.'));
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  };

  if (!ready || !isAuthenticated || !isConsultant) {
    return <p className="tv-muted">Yükleniyor…</p>;
  }

  return (
    <div>
      <header className="tv-ar-page-header">
        <div>
          <Link href="/consultant/chat" className="tv-muted">
            ← Danışan sohbetleri
          </Link>
          <h1 className="tv-page-title">{session?.title ?? 'Peyzaj sohbeti'}</h1>
          {session ? <p className="tv-page-lead">Danışan: {session.customerName}</p> : null}
        </div>
      </header>

      {loading ? <p className="tv-muted">Mesajlar yükleniyor…</p> : null}
      {error ? <p className="tv-form-error">{error}</p> : null}

      <ChatProposalComposer sessionId={sessionId} onSent={() => void loadChat()} />

      <div className="tv-card tv-chat-panel">
        <div ref={listRef} className="tv-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.kind === ChatMessageKind.Proposal
                  ? 'tv-chat-message tv-chat-message--proposal'
                  : 'tv-chat-message'
              }
            >
              <p className="tv-chat-message-meta">
                <strong>{message.senderName}</strong> ·{' '}
                {new Date(message.createdDate).toLocaleString('tr-TR')}
              </p>
              {message.kind === ChatMessageKind.Proposal && message.proposal ? (
                <ProposalCard proposal={message.proposal} canAddToCart={false} />
              ) : (
                <p className="tv-chat-message-body">{message.content}</p>
              )}
            </div>
          ))}
        </div>

        <form className="tv-chat-compose" onSubmit={(e) => void handleSubmit(e)}>
          <input
            className="tv-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Danışana yanıt yazın…"
            maxLength={2000}
            disabled={sending}
          />
          <button type="submit" className="tv-btn tv-btn--primary" disabled={sending || !input.trim()}>
            {sending ? 'Gönderiliyor…' : 'Gönder'}
          </button>
        </form>
      </div>
    </div>
  );
}
