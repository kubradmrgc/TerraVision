import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CareActionType, CareCatalogPlantDto, PlantCareCalendarDto } from '@terravision/shared';
import type { MobilePalette } from '../app/types';
import { SectionHeader } from '../../ui/SectionHeader';
import { careStrings } from '../../i18n/tr';
import { CareAssistantSection } from './CareAssistantSection';
import { CareCalendarSection } from './CareCalendarSection';

export type CareHubTab = 'assistant' | 'calendar';

type Props = {
  plants: PlantCareCalendarDto[];
  catalogPlants: CareCatalogPlantDto[];
  palette: MobilePalette;
  isCalendarLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  isMutating: boolean;
  mutatingKey: string | null;
  onAddPlant: (productId: number) => void;
  onCompleteAction: (calendarId: number, actionType: CareActionType) => void;
};

export function CareHubSection({
  plants,
  catalogPlants,
  palette,
  isCalendarLoading,
  errorMessage,
  successMessage,
  isMutating,
  mutatingKey,
  onAddPlant,
  onCompleteAction
}: Props): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CareHubTab>('assistant');

  return (
    <View style={styles.wrap}>
      <View style={styles.headerPad}>
        <SectionHeader
          title={careStrings.hubTitle}
          subtitle={careStrings.hubSubtitle}
          titleColor={palette.text}
          subtitleColor={palette.subText}
        />
      </View>

      <View style={[styles.tabRow, { borderColor: palette.border, backgroundColor: palette.mutedCard }]}>
        {(['assistant', 'calendar'] as const).map((tab) => {
          const selected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                selected && { backgroundColor: palette.productCtaBg, borderColor: palette.productCtaBorder }
              ]}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: selected ? palette.productCtaFg : palette.subText }
                ]}
              >
                {tab === 'assistant' ? careStrings.tabAssistant : careStrings.tabCalendar}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'assistant' ? (
        <CareAssistantSection palette={palette} catalogPlants={catalogPlants} embedded />
      ) : (
        <CareCalendarSection
          plants={plants}
          catalogPlants={catalogPlants}
          palette={palette}
          isLoading={isCalendarLoading}
          errorMessage={errorMessage}
          successMessage={successMessage}
          isMutating={isMutating}
          mutatingKey={mutatingKey}
          onAddPlant={onAddPlant}
          onCompleteAction={onCompleteAction}
          embedded
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  headerPad: { paddingHorizontal: 16 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center'
  },
  tabLabel: { fontSize: 14, fontWeight: '700' }
});
