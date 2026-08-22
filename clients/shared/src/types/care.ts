/** CareActionType — must match TerraVision.Api.Enums.CareActionType */
export type CareActionType = 1 | 2 | 3;

/** CareTaskUrgency — must match TerraVision.Api.Enums.CareTaskUrgency */
export type CareTaskUrgency = 0 | 1 | 2 | 3;

export type CareTaskDto = {
  actionType: CareActionType;
  intervalDays: number | null;
  nextDueAt: string | null;
  lastCompletedAt: string | null;
  urgency: CareTaskUrgency;
  isActionEnabled: boolean;
};

export type PlantCareCalendarDto = {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  careInstructions: string | null;
  overallUrgency: CareTaskUrgency;
  tasks: CareTaskDto[];
};

export type MyPlantCareCalendarResponse = {
  plants: PlantCareCalendarDto[];
};

export type CompleteCareActionRequest = {
  actionType: CareActionType;
  notes?: string | null;
};

export type AddPlantToGardenRequest = {
  productId: number;
};

export type CareCatalogPlantDto = {
  id: number;
  name: string;
  careInstructions: string | null;
  wateringIntervalDays: number | null;
  fertilizingIntervalDays: number | null;
  cleaningIntervalDays: number | null;
  isInMyGarden: boolean;
};

export const CARE_ACTION_LABELS: Record<CareActionType, string> = {
  1: 'Sulama',
  2: 'Gübreleme',
  3: 'Temizlik'
};

export const CARE_URGENCY_LABELS: Record<CareTaskUrgency, string> = {
  0: 'Planlı',
  1: 'Yaklaşıyor',
  2: 'Bugün',
  3: 'Gecikmiş'
};
