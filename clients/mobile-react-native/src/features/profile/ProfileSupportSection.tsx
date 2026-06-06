import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { isAxiosError } from 'axios';
import {
  channelByKey,
  siteSupportService,
  type SiteContactChannel
} from '../../services/siteSupportService';
import type { MobilePalette } from '../app/types';

const USER_STORY_PLACEHOLDER =
  'Ziyaretçi olarak, [sorunu yazın], böylece [beklediğiniz sonuç].';

type Props = {
  palette: MobilePalette;
  profileEmail: string;
};

function feedbackErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string; title?: string } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (typeof data?.title === 'string' && data.title.trim()) {
      return data.title;
    }
    if (err.response?.status === 429) {
      return 'Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.';
    }
  }
  return fallback;
}

function MailLink({
  channel,
  palette
}: {
  channel: SiteContactChannel | undefined;
  palette: MobilePalette;
}): React.JSX.Element {
  if (!channel) {
    return <Text style={[styles.lead, { color: palette.subText }]}>Yükleniyor…</Text>;
  }

  return (
    <>
      <Text style={[styles.lead, { color: palette.subText }]}>{channel.label}</Text>
      <TouchableOpacity
        onPress={() => void Linking.openURL(`mailto:${channel.email}`)}
        accessibilityRole="link"
        accessibilityLabel={`${channel.label} e-posta`}
      >
        <Text style={[styles.mail, { color: palette.brandTitle }]}>{channel.email}</Text>
      </TouchableOpacity>
    </>
  );
}

export function ProfileSupportSection({ palette, profileEmail }: Props): React.JSX.Element {
  const [channels, setChannels] = useState<SiteContactChannel[]>([]);
  const [hint, setHint] = useState('');
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [formEmail, setFormEmail] = useState(profileEmail);
  const [userStory, setUserStory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadFooter = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const footer = await siteSupportService.getFooter();
      setChannels(footer.channels);
      setHint(footer.userStoryHint);
    } catch {
      setChannels([]);
    } finally {
      setLoadingChannels(false);
    }
  }, []);

  useEffect(() => {
    void loadFooter();
  }, [loadFooter]);

  useEffect(() => {
    if (profileEmail && !formEmail) {
      setFormEmail(profileEmail);
    }
  }, [profileEmail, formEmail]);

  const support = channelByKey(channels, 'support');
  const contact = channelByKey(channels, 'contact');
  const info = channelByKey(channels, 'info');

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    const trimmedStory = userStory.trim();
    const trimmedEmail = formEmail.trim();
    if (!trimmedEmail) {
      setError('E-posta gerekli.');
      return;
    }
    if (trimmedStory.length < 20) {
      setError('User story en az 20 karakter olmalıdır.');
      return;
    }
    setSubmitting(true);
    try {
      await siteSupportService.submitFeedback({
        email: trimmedEmail,
        userStory: trimmedStory,
        kind: 'websiteIssue',
        pageUrl: `terravision-mobile://${Platform.OS}/profile`
      });
      setUserStory('');
      setSuccess('Geri bildiriminiz kaydedildi. Teşekkürler!');
      setExpanded(false);
    } catch (err) {
      setError(feedbackErrorMessage(err, 'Gönderilemedi. Lütfen tekrar deneyin.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
      <Text style={[styles.cardLabel, { color: palette.subText }]}>DESTEK & GERİ BİLDİRİM</Text>
      <Text style={[styles.sectionIntro, { color: palette.subText }]}>
        Uygulama ve site ile ilgili sorunları user story olarak iletebilir, destek ekibine ulaşabilirsiniz.
      </Text>

      <View style={[styles.block, { borderTopColor: palette.outlineVariant }]}>
        <Text style={[styles.blockTitle, { color: palette.text }]}>Sorunlar</Text>
        <Text style={[styles.lead, { color: palette.subText }]}>
          Uygulama veya web deneyimiyle ilgili sorunu user story olarak bildirin.
        </Text>
        {!expanded ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder }]}
            onPress={() => setExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel="Sorun bildir"
          >
            <Text style={[styles.primaryBtnText, { color: palette.productCtaFg }]}>Sorun bildir</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.fieldLabel, { color: palette.subText }]}>E-posta</Text>
            <TextInput
              style={[
                styles.input,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.mutedCard }
              ]}
              value={formEmail}
              onChangeText={setFormEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="ornek@email.com"
              placeholderTextColor={palette.subText}
            />
            <Text style={[styles.fieldLabel, { color: palette.subText }]}>User story</Text>
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.mutedCard }
              ]}
              value={userStory}
              onChangeText={setUserStory}
              placeholder={USER_STORY_PLACEHOLDER}
              placeholderTextColor={palette.subText}
              multiline
              maxLength={2000}
            />
            {hint ? (
              <Text style={[styles.hint, { color: palette.subText }]}>{hint}</Text>
            ) : null}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  { backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder },
                  submitting && styles.btnDisabled
                ]}
                onPress={() => void handleSubmit()}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Geri bildirim gönder"
              >
                {submitting ? (
                  <ActivityIndicator color={palette.productCtaFg} size="small" />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: palette.productCtaFg }]}>Gönder</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: palette.outlineVariant }]}
                onPress={() => {
                  setExpanded(false);
                  setError(null);
                }}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Formu kapat"
              >
                <Text style={[styles.secondaryBtnText, { color: palette.text }]}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {error ? <Text style={[styles.error, { color: palette.stockLowPillText }]}>{error}</Text> : null}
        {success ? <Text style={[styles.success, { color: palette.brandTitle }]}>{success}</Text> : null}
      </View>

      <View style={[styles.block, { borderTopColor: palette.outlineVariant }]}>
        <Text style={[styles.blockTitle, { color: palette.text }]}>Destek</Text>
        {loadingChannels ? (
          <ActivityIndicator color={palette.brandTitle} style={styles.loader} />
        ) : (
          <MailLink channel={support} palette={palette} />
        )}
      </View>

      <View style={[styles.block, { borderTopColor: palette.outlineVariant }]}>
        <Text style={[styles.blockTitle, { color: palette.text }]}>İletişim</Text>
        {loadingChannels ? (
          <ActivityIndicator color={palette.brandTitle} style={styles.loader} />
        ) : (
          <MailLink channel={contact} palette={palette} />
        )}
      </View>

      {info ? (
        <View style={[styles.block, { borderTopColor: palette.outlineVariant }]}>
          <Text style={[styles.blockTitle, { color: palette.text }]}>Kurumsal</Text>
          <MailLink channel={info} palette={palette} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  sectionIntro: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4
  },
  block: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    marginTop: 12,
    gap: 8
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700'
  },
  lead: {
    fontSize: 13,
    lineHeight: 18
  },
  mail: {
    fontSize: 14,
    fontWeight: '600'
  },
  primaryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: 'center'
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center'
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600'
  },
  btnDisabled: {
    opacity: 0.7
  },
  form: {
    gap: 8
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  hint: {
    fontSize: 11,
    lineHeight: 16
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  error: {
    fontSize: 13,
    marginTop: 4
  },
  success: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4
  },
  loader: {
    alignSelf: 'flex-start'
  }
});
