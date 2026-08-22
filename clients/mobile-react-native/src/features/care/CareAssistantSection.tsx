import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  CARE_ASSISTANT_PROMPTS,
  CareAssistantHistoryMessage,
  CareCatalogPlantDto,
  toStatusMessage
} from '@terravision/shared';
import { careService } from '../../services/careService';
import type { MobilePalette } from '../app/types';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type Props = {
  palette: MobilePalette;
  catalogPlants?: CareCatalogPlantDto[];
  /** Hub içinde kullanıldığında dış kenar boşluklarını kaldırır. */
  embedded?: boolean;
};

function modeLabel(mode: string): string {
  return mode === 'llm' ? 'Yapay zeka' : 'Yerel özet';
}

export function CareAssistantSection({ palette, catalogPlants = [], embedded = false }: Props): React.JSX.Element {
  const scrollRef = useRef<ScrollView>(null);
  const [focusProductId, setFocusProductId] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Merhaba! Bakım takviminize göre sulama, gübre ve temizlik hakkında soru sorabilirsiniz.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      setInput('');
      const userMessage: ChatMessage = { role: 'user', content: trimmed };
      const history: CareAssistantHistoryMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

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
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      } catch (err) {
        setError(toStatusMessage(err, 'Asistan yanıt veremedi.', {}));
        setMessages((prev) => prev.slice(0, -1));
        setInput(trimmed);
      } finally {
        setLoading(false);
      }
    },
    [focusProductId, loading, messages]
  );

  const content = (
    <>
      {!embedded ? (
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: palette.text }]}>Bakım asistanı</Text>
          {lastMode ? (
            <View style={[styles.modePill, { backgroundColor: palette.primaryContainer, borderColor: palette.border }]}>
              <Text style={[styles.modeText, { color: palette.brandTitle }]}>{modeLabel(lastMode)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {embedded && lastMode ? (
        <View style={styles.embeddedModeRow}>
          <Text style={[styles.lead, { color: palette.subText }]}>Son yanıt:</Text>
          <View style={[styles.modePill, { backgroundColor: palette.primaryContainer, borderColor: palette.border }]}>
            <Text style={[styles.modeText, { color: palette.brandTitle }]}>{modeLabel(lastMode)}</Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.lead, { color: palette.subText }]}>
          Takviminize göre kişiselleştirilmiş bakım önerileri alın.
        </Text>
      )}

      {catalogPlants.length > 0 ? (
        <View style={styles.focusRow}>
          <Text style={[styles.lead, { color: palette.subText }]}>Katalog bitkisi (opsiyonel):</Text>
          <View style={styles.chips}>
            <TouchableOpacity
              style={[styles.chip, { borderColor: palette.border, backgroundColor: !focusProductId ? palette.productCtaBg : palette.mutedCard }]}
              onPress={() => setFocusProductId(undefined)}
            >
              <Text style={[styles.chipText, { color: !focusProductId ? palette.productCtaFg : palette.text }]}>Tümü</Text>
            </TouchableOpacity>
            {catalogPlants.slice(0, 8).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.chip,
                  {
                    borderColor: palette.border,
                    backgroundColor: focusProductId === p.id ? palette.productCtaBg : palette.mutedCard
                  }
                ]}
                onPress={() => setFocusProductId(p.id)}
              >
                <Text style={[styles.chipText, { color: focusProductId === p.id ? palette.productCtaFg : palette.text }]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.chips}>
        {CARE_ASSISTANT_PROMPTS.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.mutedCard }]}
            disabled={loading}
            onPress={() => void sendMessage(prompt)}
            accessibilityRole="button"
          >
            <Text style={[styles.chipText, { color: palette.text }]}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        style={[styles.messagesScroll, { backgroundColor: palette.mutedCard, borderColor: palette.border }]}
        contentContainerStyle={styles.messages}
        nestedScrollEnabled
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg, index) => (
          <View
            key={`${msg.role}-${index}`}
            style={[
              styles.bubble,
              msg.role === 'user'
                ? { alignSelf: 'flex-end', backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder }
                : { alignSelf: 'flex-start', backgroundColor: palette.card, borderColor: palette.border }
            ]}
          >
            <Text
              style={[
                styles.bubbleLabel,
                { color: msg.role === 'user' ? palette.productCtaFg : palette.subText }
              ]}
            >
              {msg.role === 'user' ? 'Siz' : 'Asistan'}
            </Text>
            <Text style={[styles.bubbleText, { color: msg.role === 'user' ? palette.productCtaFg : palette.text }]}>
              {msg.content}
            </Text>
          </View>
        ))}
        {loading ? (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={palette.brandTitle} />
            <Text style={[styles.typingText, { color: palette.subText }]}>Yanıt hazırlanıyor…</Text>
          </View>
        ) : null}
      </ScrollView>

      {error ? <Text style={[styles.error, { color: palette.stockLowPillText }]}>{error}</Text> : null}

      <View style={styles.form}>
        <TextInput
          style={[
            styles.input,
            { color: palette.text, borderColor: palette.border, backgroundColor: palette.mutedCard }
          ]}
          value={input}
          editable={!loading}
          placeholder="Sorunuzu yazın…"
          placeholderTextColor={palette.subText}
          multiline
          returnKeyType="send"
          blurOnSubmit
          onSubmitEditing={() => void sendMessage(input)}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder },
            (loading || !input.trim()) && styles.sendBtnDisabled
          ]}
          disabled={loading || !input.trim()}
          onPress={() => void sendMessage(input)}
          accessibilityRole="button"
          accessibilityLabel="Mesaj gönder"
        >
          {loading ? (
            <ActivityIndicator color={palette.productCtaFg} size="small" />
          ) : (
            <Text style={[styles.sendText, { color: palette.productCtaFg }]}>Gönder</Text>
          )}
        </TouchableOpacity>
      </View>

      {disclaimer ? (
        <Text style={[styles.disclaimer, { color: palette.subText }]}>{disclaimer}</Text>
      ) : null}
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={embedded ? styles.embeddedOuter : undefined}
    >
      <View
        style={[
          styles.wrap,
          embedded && styles.wrapEmbedded,
          { borderColor: palette.border, backgroundColor: palette.card }
        ]}
      >
        {content}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  embeddedOuter: { flex: 1 },
  wrap: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10
  },
  wrapEmbedded: {
    marginTop: 0,
    marginBottom: 16
  },
  embeddedModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 17, fontWeight: '700', flex: 1 },
  modePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  modeText: { fontSize: 11, fontWeight: '700' },
  lead: { fontSize: 13, lineHeight: 18 },
  focusRow: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12 },
  messagesScroll: {
    maxHeight: 280,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4
  },
  messages: { gap: 8, padding: 12 },
  bubble: {
    maxWidth: '92%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4
  },
  bubbleLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  typingText: { fontSize: 13 },
  error: { fontSize: 13 },
  form: { gap: 8, marginTop: 4 },
  input: {
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    textAlignVertical: 'top'
  },
  sendBtn: {
    alignSelf: 'flex-end',
    minWidth: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  sendBtnDisabled: { opacity: 0.55 },
  sendText: { fontSize: 14, fontWeight: '700' },
  disclaimer: { fontSize: 11, lineHeight: 16, marginTop: 4 }
});
