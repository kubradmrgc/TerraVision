import React, { useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArPreviewResponse } from '../../types/ar';
import { launchNativeAr } from './nativeArBridge';

interface ArExperienceModalProps {
  visible: boolean;
  preview: ArPreviewResponse | null;
  onClose: () => void;
}

export function ArExperienceModal({
  visible,
  preview,
  onClose
}: ArExperienceModalProps): React.JSX.Element {
  const [isLaunching, setIsLaunching] = useState(false);

  const canStart = useMemo(() => !!preview && !isLaunching, [preview, isLaunching]);

  const handleStartAr = async () => {
    if (!preview || isLaunching) {
      return;
    }

    try {
      setIsLaunching(true);
      await launchNativeAr(preview);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Native AR launch failed.';
      Alert.alert('AR Launch Error', message);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>AR Experience</Text>
          {preview ? (
            <>
              <Text style={styles.text}>Ready for: {preview.productName}</Text>
              <Text style={styles.text}>Model: {preview.modelFormat}</Text>
            </>
          ) : (
            <Text style={styles.text}>Preview data not found.</Text>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, !canStart && styles.primaryButtonDisabled]}
            disabled={!canStart}
            onPress={handleStartAr}
          >
            <Text style={styles.primaryButtonText}>{isLaunching ? 'Launching...' : 'Start Native AR'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10
  },
  text: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#2f7d32',
    borderRadius: 8,
    paddingVertical: 10
  },
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8'
  },
  primaryButtonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: '600'
  },
  secondaryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2f7d32',
    borderRadius: 8,
    paddingVertical: 10
  },
  secondaryButtonText: {
    textAlign: 'center',
    color: '#2f7d32',
    fontWeight: '600'
  }
});
