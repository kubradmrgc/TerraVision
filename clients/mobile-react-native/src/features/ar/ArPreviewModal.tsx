import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArPreviewResponse } from '../../types/ar';

interface ArPreviewModalProps {
  visible: boolean;
  preview: ArPreviewResponse | null;
  onStartAr: () => void;
  onClose: () => void;
}

export function ArPreviewModal({
  visible,
  preview,
  onStartAr,
  onClose
}: ArPreviewModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>AR Preview</Text>
          {preview ? (
            <>
              <Text style={styles.text}>Product: {preview.productName}</Text>
              <Text style={styles.text}>Format: {preview.modelFormat}</Text>
              <Text style={styles.text}>Placement: {preview.placementHint}</Text>
              <Text style={styles.text}>Scale: {preview.suggestedScale}</Text>
              <Text style={styles.url}>{preview.modelUrl}</Text>
            </>
          ) : (
            <Text style={styles.text}>No preview data.</Text>
          )}

          <TouchableOpacity style={styles.startButton} disabled={!preview} onPress={onStartAr}>
            <Text style={styles.startButtonText}>Continue To AR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
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
    marginBottom: 4,
    color: '#111827'
  },
  url: {
    fontSize: 12,
    marginTop: 8,
    color: '#374151'
  },
  startButton: {
    marginTop: 16,
    backgroundColor: '#2f7d32',
    borderRadius: 8,
    paddingVertical: 10
  },
  startButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600'
  },
  closeButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2f7d32',
    borderRadius: 8,
    paddingVertical: 10
  },
  closeButtonText: {
    color: '#2f7d32',
    textAlign: 'center',
    fontWeight: '600'
  }
});
