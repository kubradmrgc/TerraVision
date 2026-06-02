import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import type { MobilePalette } from '../app/types';
import { ArPreviewResponse } from '../../types/ar';
import { launchNativeAr } from './nativeArBridge';

interface ArExperienceModalProps {
  visible: boolean;
  preview: ArPreviewResponse | null;
  palette: MobilePalette;
  onClose: () => void;
  onSaveLayout: (params: {
    environmentNotes: string;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    rotationY: number;
    screenshot: { uri: string; name: string; type: string };
  }) => Promise<void>;
  isSaving: boolean;
  saveProgress: number;
  saveErrorMessage: string | null;
  saveSuccessMessage: string | null;
}

export function ArExperienceModal({
  visible,
  preview,
  palette,
  onClose,
  onSaveLayout,
  isSaving,
  saveProgress,
  saveErrorMessage,
  saveSuccessMessage
}: ArExperienceModalProps): React.JSX.Element {
  const [isLaunching, setIsLaunching] = useState(false);
  const [hasLaunchedAr, setHasLaunchedAr] = useState(false);
  const [environmentNotes, setEnvironmentNotes] = useState('');

  const suggestedScale = preview?.suggestedScale ?? 1;
  const canStart = useMemo(() => !!preview && !isLaunching && !isSaving, [preview, isLaunching, isSaving]);
  const canSave = useMemo(
    () => !!preview && hasLaunchedAr && !isLaunching && !isSaving,
    [preview, hasLaunchedAr, isLaunching, isSaving]
  );

  const handleStartAr = async () => {
    if (!preview || isLaunching || isSaving) {
      return;
    }

    try {
      setIsLaunching(true);
      await launchNativeAr(preview);
      setHasLaunchedAr(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Yerel AR başlatılamadı.';
      Alert.alert('AR hatası', message);
    } finally {
      setIsLaunching(false);
    }
  };

  const pickScreenshot = async (): Promise<{ uri: string; name: string; type: string } | null> => {
    const [file] = await pick({
      type: [types.images],
      allowMultiSelection: false
    });
    if (!file?.uri) {
      return null;
    }
    const name = file.name ?? `ar-session-${Date.now()}.jpg`;
    const type = file.type ?? 'image/jpeg';
    return { uri: file.uri, name, type };
  };

  const handleSaveLayout = async () => {
    if (!preview || !canSave) {
      return;
    }

    try {
      let screenshot: { uri: string; name: string; type: string } | null = null;
      try {
        screenshot = await pickScreenshot();
      } catch (error) {
        if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
          return;
        }
        throw error;
      }
      if (!screenshot) {
        Alert.alert('Ekran görüntüsü', 'AR yerleşimini kaydetmek için bir ekran görüntüsü seçin.');
        return;
      }

      await onSaveLayout({
        environmentNotes: environmentNotes.trim(),
        scaleX: suggestedScale,
        scaleY: suggestedScale,
        scaleZ: suggestedScale,
        rotationY: 0,
        screenshot
      });
    } catch {
      // errors surfaced via saveErrorMessage in controller
    }
  };

  const saveButtonLabel = isSaving
    ? `Kaydediliyor %${saveProgress}`
    : saveErrorMessage
      ? 'Tekrar dene'
      : 'Tasarımı odama kaydet';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.outlineVariant }]}>
          <Text style={[styles.title, { color: palette.text }]}>AR Deneyimi</Text>
          {preview ? (
            <>
              <Text style={[styles.text, { color: palette.subText }]}>Urun: {preview.productName}</Text>
              <Text style={[styles.text, { color: palette.subText }]}>
                Model: {preview.modelFormat} · Olcek {suggestedScale}
              </Text>
            </>
          ) : (
            <Text style={[styles.text, { color: palette.subText }]}>Onizleme verisi bulunamadi.</Text>
          )}

          <TextInput
            style={[
              styles.notesInput,
              {
                color: palette.text,
                borderColor: palette.outlineVariant,
                backgroundColor: palette.mutedCard
              }
            ]}
            placeholder="Ortam notları (ışık, alan genişliği…)"
            placeholderTextColor={palette.subText}
            value={environmentNotes}
            onChangeText={setEnvironmentNotes}
            editable={!isSaving}
            multiline
          />

          {saveErrorMessage ? (
            <Text style={[styles.feedbackError, { color: palette.stockLowPillText }]}>{saveErrorMessage}</Text>
          ) : null}
          {saveSuccessMessage ? (
            <Text style={[styles.feedbackSuccess, { color: palette.onSecondaryContainer }]}>{saveSuccessMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: palette.button },
              !canStart && styles.primaryButtonDisabled
            ]}
            disabled={!canStart}
            onPress={handleStartAr}
          >
            <Text style={[styles.primaryButtonText, { color: palette.buttonText }]}>
              {isLaunching ? 'AR açılıyor…' : 'Yerel AR başlat'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: palette.primaryContainer },
              !canSave && styles.primaryButtonDisabled
            ]}
            disabled={!canSave}
            onPress={handleSaveLayout}
          >
            <Text style={[styles.saveButtonText, { color: palette.onPrimaryContainer }]}>{saveButtonLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: palette.outlineVariant }]}
            disabled={isSaving}
            onPress={onClose}
          >
            <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Kapat</Text>
          </TouchableOpacity>

          {!hasLaunchedAr ? (
            <Text style={[styles.hint, { color: palette.subText }]}>
              Kaydetmeden once AR deneyimini baslatin; ardindan ekran goruntunuzu secin.
            </Text>
          ) : (
            <Text style={[styles.hint, { color: palette.subText }]}>
              Cihaz: {Platform.OS} {String(Platform.Version)}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10
  },
  text: {
    fontSize: 14,
    marginBottom: 4
  },
  notesInput: {
    marginTop: 12,
    marginBottom: 8,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top'
  },
  feedbackError: {
    fontSize: 13,
    marginBottom: 6
  },
  feedbackSuccess: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600'
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 10
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 10
  },
  primaryButtonDisabled: {
    opacity: 0.5
  },
  primaryButtonText: {
    textAlign: 'center',
    fontWeight: '600'
  },
  saveButtonText: {
    textAlign: 'center',
    fontWeight: '700'
  },
  secondaryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10
  },
  secondaryButtonText: {
    textAlign: 'center',
    fontWeight: '600'
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 16
  }
});
