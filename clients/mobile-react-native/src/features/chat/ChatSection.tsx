import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChatConsultantDto,
  ChatMessageDto,
  ChatMessageKind,
  ConsultationSessionDto,
  toStatusMessage,
  USER_ROLE
} from '@terravision/shared';
import { chatService } from '../../services/chatService';
import { realtimeService } from '../../services/realtimeService';
import type { MobilePalette } from '../app/types';
import { ChatProposalComposer } from './ChatProposalComposer';
import { ProposalCard } from './ProposalCard';

const PEYZAJ_CONSULTANT_IDS = [4, 5, 6];

type Props = {
  palette: MobilePalette;
  role: number | null;
};

function appendMessage(messages: ChatMessageDto[], incoming: ChatMessageDto): ChatMessageDto[] {
  if (messages.some((m) => m.id === incoming.id)) {
    return messages;
  }
  return [...messages, incoming];
}

export function ChatSection({ palette, role }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const isConsultant = role === USER_ROLE.Consultant;
  const isCustomer = role === USER_ROLE.Customer;
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [startingConsultantId, setStartingConsultantId] = useState<number | null>(null);
  const listRef = useRef<FlatList<ChatMessageDto>>(null);

  const sessionsQuery = useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: chatService.getMySessions
  });

  const consultantsQuery = useQuery({
    queryKey: ['chat', 'consultants'],
    queryFn: chatService.getConsultants,
    enabled: isCustomer
  });

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', selectedSessionId],
    queryFn: () => chatService.getMessages(selectedSessionId!),
    enabled: selectedSessionId !== null
  });

  const createSessionMutation = useMutation({
    mutationFn: (consultant: ChatConsultantDto) =>
      chatService.createSession({
        consultantId: consultant.id,
        title: `Peyzaj planı — ${consultant.displayName}`
      }),
    onSuccess: async (session) => {
      await queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
      setSelectedSessionId(session.id);
      setStartingConsultantId(null);
    },
    onError: (err) => {
      setStartingConsultantId(null);
      setError(toStatusMessage(err, 'Sohbet başlatılamadı.', {}));
    }
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => chatService.sendMessage(selectedSessionId!, { content }),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatMessageDto[]>(
        ['chat', 'messages', selectedSessionId],
        (prev) => appendMessage(prev ?? [], message)
      );
      setInput('');
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    },
    onError: (err) => {
      setError(toStatusMessage(err, 'Mesaj gönderilemedi.', {}));
    }
  });

  useEffect(() => {
    if (selectedSessionId === null) {
      return;
    }

    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
      try {
        await realtimeService.connect();
        await realtimeService.joinChatSession(selectedSessionId);
        if (disposed) {
          return;
        }

        unsubscribe = realtimeService.onChatMessageReceived((event) => {
          if (event.message.sessionId !== selectedSessionId) {
            return;
          }
          queryClient.setQueryData<ChatMessageDto[]>(
            ['chat', 'messages', selectedSessionId],
            (prev) => appendMessage(prev ?? [], event.message)
          );
          requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
        });
      } catch {
        // Realtime optional; REST still works.
      }
    };

    void setup();

    return () => {
      disposed = true;
      unsubscribe?.();
      void realtimeService.leaveChatSession(selectedSessionId);
    };
  }, [selectedSessionId, queryClient]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || selectedSessionId === null || sendMutation.isPending) {
      return;
    }
    setError(null);
    sendMutation.mutate(trimmed);
  }, [input, selectedSessionId, sendMutation]);

  const handleStartChat = (consultant: ChatConsultantDto) => {
    const existing = (sessionsQuery.data ?? []).find(
      (s) => s.consultantId === consultant.id && s.status === 1
    );
    if (existing) {
      setSelectedSessionId(existing.id);
      return;
    }
    setError(null);
    setStartingConsultantId(consultant.id);
    createSessionMutation.mutate(consultant);
  };

  const sessions = sessionsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;
  const consultants = (consultantsQuery.data ?? []).filter((c) => PEYZAJ_CONSULTANT_IDS.includes(c.id));

  if (selectedSessionId === null) {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.title, { color: palette.text }]}>Peyzaj sohbeti</Text>
        <Text style={[styles.lead, { color: palette.subText }]}>
          {isConsultant
            ? 'Danışanlarınızla yazışın ve ürün teklifleri gönderin.'
            : 'Peyzaj danışmanınızı seçin veya mevcut sohbetinize devam edin.'}
        </Text>

        {isCustomer ? (
          <>
            <Text style={[styles.sectionLabel, { color: palette.text }]}>Danışman seçin</Text>
            {consultantsQuery.isLoading ? <ActivityIndicator color={palette.brandTitle} /> : null}
            {consultants.map((consultant) => (
              <TouchableOpacity
                key={consultant.id}
                style={[styles.consultantCard, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}
                disabled={startingConsultantId === consultant.id}
                onPress={() => handleStartChat(consultant)}
              >
                <Text style={[styles.consultantName, { color: palette.text }]}>{consultant.displayName}</Text>
                <Text style={[styles.consultantMeta, { color: palette.subText }]}>{consultant.email}</Text>
                {startingConsultantId === consultant.id ? (
                  <ActivityIndicator color={palette.brandTitle} style={styles.consultantSpinner} />
                ) : (
                  <Text style={[styles.consultantCta, { color: palette.brandTitle }]}>Sohbet başlat →</Text>
                )}
              </TouchableOpacity>
            ))}
          </>
        ) : null}

        {error ? <Text style={[styles.error, { color: palette.stockLowPillText }]}>{error}</Text> : null}

        <Text style={[styles.sectionLabel, { color: palette.text }]}>
          {isConsultant ? 'Danışan sohbetleri' : 'Sohbetlerim'}
        </Text>
        {sessionsQuery.isLoading ? <ActivityIndicator color={palette.brandTitle} /> : null}
        {sessions.length === 0 && !sessionsQuery.isLoading ? (
          <Text style={[styles.empty, { color: palette.subText }]}>
            {isConsultant ? 'Henüz danışan sohbetiniz yok.' : 'Henüz sohbet oturumunuz yok.'}
          </Text>
        ) : null}
        {sessions.map((session: ConsultationSessionDto) => (
          <TouchableOpacity
            key={session.id}
            style={[styles.sessionCard, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}
            onPress={() => setSelectedSessionId(session.id)}
          >
            <Text style={[styles.sessionTitle, { color: palette.text }]}>{session.title}</Text>
            <Text style={[styles.sessionMeta, { color: palette.subText }]}>
              {isConsultant ? session.customerName : session.consultantName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <TouchableOpacity onPress={() => setSelectedSessionId(null)}>
        <Text style={[styles.back, { color: palette.brandTitle }]}>← Sohbetler</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: palette.text }]}>{selectedSession?.title ?? 'Sohbet'}</Text>
      <Text style={[styles.lead, { color: palette.subText }]}>
        {isConsultant
          ? `Danışan: ${selectedSession?.customerName ?? '—'}`
          : `Danışman: ${selectedSession?.consultantName ?? '—'}`}
      </Text>
      {error ? <Text style={[styles.error, { color: palette.stockLowPillText }]}>{error}</Text> : null}

      {isConsultant ? (
        <ChatProposalComposer
          sessionId={selectedSessionId}
          palette={palette}
          onSent={() => queryClient.invalidateQueries({ queryKey: ['chat', 'messages', selectedSessionId] })}
        />
      ) : null}

      {messagesQuery.isLoading ? <ActivityIndicator color={palette.brandTitle} /> : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, { backgroundColor: palette.mutedCard, borderColor: palette.outlineVariant }]}>
            <Text style={[styles.messageMeta, { color: palette.subText }]}>
              {item.senderName} · {new Date(item.createdDate).toLocaleString('tr-TR')}
            </Text>
            {item.kind === ChatMessageKind.Proposal && item.proposal ? (
              <ProposalCard
                proposal={item.proposal}
                palette={palette}
                onAdded={() => queryClient.invalidateQueries({ queryKey: ['cart'] })}
              />
            ) : (
              <Text style={[styles.messageBody, { color: palette.text }]}>{item.content}</Text>
            )}
          </View>
        )}
      />

      <View style={[styles.composeRow, { borderColor: palette.outlineVariant }]}>
        <TextInput
          style={[styles.input, { color: palette.text, borderColor: palette.outlineVariant, backgroundColor: palette.card }]}
          value={input}
          onChangeText={setInput}
          placeholder="Mesajınızı yazın…"
          placeholderTextColor={palette.subText}
          maxLength={2000}
          editable={!sendMutation.isPending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder }]}
          disabled={sendMutation.isPending || !input.trim()}
          onPress={handleSend}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator color={palette.productCtaFg} size="small" />
          ) : (
            <Text style={[styles.sendText, { color: palette.productCtaFg }]}>Gönder</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    flex: 1
  },
  title: {
    fontSize: 22,
    fontWeight: '700'
  },
  lead: {
    fontSize: 14,
    lineHeight: 20
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4
  },
  empty: {
    fontSize: 14
  },
  consultantCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4
  },
  consultantName: {
    fontSize: 17,
    fontWeight: '700'
  },
  consultantMeta: {
    fontSize: 12
  },
  consultantCta: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4
  },
  consultantSpinner: {
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  sessionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  sessionMeta: {
    fontSize: 13
  },
  back: {
    fontSize: 14,
    fontWeight: '600'
  },
  error: {
    fontSize: 13
  },
  messageList: {
    flex: 1,
    maxHeight: 420
  },
  messageListContent: {
    gap: 10,
    paddingBottom: 8
  },
  messageBubble: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8
  },
  messageMeta: {
    fontSize: 12
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 21
  },
  composeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15
  },
  sendBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: 'center'
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600'
  }
});
