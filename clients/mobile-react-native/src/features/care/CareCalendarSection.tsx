import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import {
  CARE_ACTION_LABELS,
  CARE_URGENCY_LABELS,
  CareActionType,
  CareCatalogPlantDto,
  CareTaskDto,
  CareTaskUrgency,
  PlantCareCalendarDto
} from '@terravision/shared';
import type { MobilePalette } from '../app/types';
import { StateMessage } from '../../ui/StateMessage';

type Props = {
  plants: PlantCareCalendarDto[];
  catalogPlants: CareCatalogPlantDto[];
  palette: MobilePalette;
  isLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  isMutating: boolean;
  mutatingKey: string | null;
  onAddPlant: (productId: number) => void;
  onCompleteAction: (calendarId: number, actionType: CareActionType) => void;
  /** Hub içinde kullanıldığında üst boşlukları sıfırlar. */
  embedded?: boolean;
};

function urgencyColor(urgency: CareTaskUrgency, palette: MobilePalette): string {
  if (urgency === 3) return palette.stockLowPillText;
  if (urgency === 2) return palette.brandTitle;
  if (urgency === 1) return palette.onSecondaryContainer;
  return palette.subText;
}

function formatDue(nextDueAt: string | null): string {
  if (!nextDueAt) return '—';
  return new Date(nextDueAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function actionButtonLabel(actionType: CareActionType): string {
  if (actionType === 1) return 'Suladım';
  if (actionType === 2) return 'Gübreledim';
  return 'Temizledim';
}

function TaskRow({
  plant,
  task,
  palette,
  isMutating,
  mutatingKey,
  onComplete
}: {
  plant: PlantCareCalendarDto;
  task: CareTaskDto;
  palette: MobilePalette;
  isMutating: boolean;
  mutatingKey: string | null;
  onComplete: Props['onCompleteAction'];
}): React.JSX.Element | null {
  if (!task.isActionEnabled) return null;

  const key = `${plant.id}-${task.actionType}`;
  const busy = isMutating && mutatingKey === key;

  return (
    <View style={[styles.taskRow, { borderColor: palette.border }]}>
      <View style={styles.taskMeta}>
        <Text style={[styles.taskTitle, { color: palette.text }]}>{CARE_ACTION_LABELS[task.actionType]}</Text>
        <Text style={[styles.taskSub, { color: palette.subText }]}>
          Sonraki: {formatDue(task.nextDueAt)} · {CARE_URGENCY_LABELS[task.urgency]}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.actionBtn,
          { backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder },
          busy && styles.actionBtnDisabled
        ]}
        onPress={() => onComplete(plant.id, task.actionType)}
        disabled={isMutating}
        accessibilityRole="button"
        accessibilityLabel={actionButtonLabel(task.actionType)}
      >
        {busy ? (
          <ActivityIndicator color={palette.productCtaFg} size="small" />
        ) : (
          <Text style={[styles.actionBtnText, { color: palette.productCtaFg }]}>
            {actionButtonLabel(task.actionType)}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function CareCalendarSection({
  plants,
  catalogPlants,
  palette,
  isLoading,
  errorMessage,
  successMessage,
  isMutating,
  mutatingKey,
  onAddPlant,
  onCompleteAction,
  embedded = false
}: Props): React.JSX.Element {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const availableCatalog = catalogPlants.filter((p) => !p.isInMyGarden);
  if (isLoading) {
    return (
      <StateMessage
        tone="loading"
        text="Bakım takvimi yükleniyor…"
        color={palette.subText}
      />
    );
  }

  if (errorMessage) {
    return <StateMessage tone="error" text={errorMessage} />;
  }

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      {successMessage ? (
        <Text style={[styles.success, { color: palette.brandTitle }]}>
          {successMessage}
        </Text>
      ) : null}

      <View style={[styles.addCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.addTitle, { color: palette.text }]}>Satın almadan bahçeme ekle</Text>
        <Text style={[styles.addSub, { color: palette.subText }]}>
          Mağazadaki bir bitkiyi takviminize ekleyin; bakım hatırlatmaları oluşur.
        </Text>
        {availableCatalog.length === 0 ? (
          <Text style={[styles.addSub, { color: palette.subText }]}>
            {catalogPlants.length === 0
              ? 'Bitki kataloğu yüklenemedi. Müşteri hesabıyla giriş yapın ve API\'nin çalıştığını kontrol edin.'
              : 'Tüm bitkiler zaten bahçenizde.'}
          </Text>
        ) : (
          <View style={styles.addRow}>
            {availableCatalog.slice(0, 6).map((item) => {
              const selected = selectedProductId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.catalogChip,
                    { borderColor: palette.border, backgroundColor: selected ? palette.productCtaBg : palette.mutedCard }
                  ]}
                  onPress={() => setSelectedProductId(item.id)}
                >
                  <Text style={{ color: selected ? palette.productCtaFg : palette.text, fontSize: 12, fontWeight: '600' }}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder },
            (!selectedProductId || isMutating) && styles.actionBtnDisabled
          ]}
          disabled={!selectedProductId || isMutating}
          onPress={() => selectedProductId && onAddPlant(selectedProductId)}
        >
          <Text style={[styles.addBtnText, { color: palette.productCtaFg }]}>Bahçeme ekle</Text>
        </TouchableOpacity>
      </View>

      {plants.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>Henüz bitki yok</Text>
          <Text style={[styles.emptySub, { color: palette.subText }]}>
            Yukarıdan bitki ekleyebilir veya Asistan sekmesinde satın almadan bakım sorusu sorabilirsiniz.
          </Text>
        </View>
      ) : null}

      {plants.map((plant) => (
        <View
          key={plant.id}
          style={[styles.plantCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.plantName, { color: palette.text }]}>{plant.productName}</Text>
          <Text style={[styles.plantUrgency, { color: urgencyColor(plant.overallUrgency, palette) }]}>
            {CARE_URGENCY_LABELS[plant.overallUrgency]}
          </Text>
          {plant.careInstructions ? (
            <Text style={[styles.instructions, { color: palette.subText }]}>{plant.careInstructions}</Text>
          ) : null}
          {plant.tasks.map((task) => (
            <TaskRow
              key={`${plant.id}-${task.actionType}`}
              plant={plant}
              task={task}
              palette={palette}
              isMutating={isMutating}
              mutatingKey={mutatingKey}
              onComplete={onCompleteAction}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  wrapEmbedded: { paddingTop: 0 },
  success: { fontSize: 14, fontWeight: '600', paddingHorizontal: 16 },
  addCard: { marginHorizontal: 16, padding: 16, borderRadius: 12, borderWidth: 1, gap: 10 },
  addTitle: { fontSize: 16, fontWeight: '700' },
  addSub: { fontSize: 13, lineHeight: 18 },
  addRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catalogChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  addBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  addBtnText: { fontSize: 14, fontWeight: '700' },
  emptyCard: { margin: 16, padding: 20, borderRadius: 12, borderWidth: 1 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, lineHeight: 20 },
  plantCard: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
  plantName: { fontSize: 17, fontWeight: '700' },
  plantUrgency: { fontSize: 13, fontWeight: '600' },
  instructions: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  taskMeta: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600' },
  taskSub: { fontSize: 12, marginTop: 2 },
  actionBtn: {
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: 13, fontWeight: '700' }
});
