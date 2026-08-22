export type CareAssistantHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type CareAssistantChatRequest = {
  message: string;
  history?: CareAssistantHistoryMessage[];
  /** Mağaza ürünü — satın almadan bakım sorusu (opsiyonel). */
  productId?: number;
};

export type CareAssistantPlantSnapshot = {
  calendarId: number;
  productName: string;
  overallUrgency: string;
};

export type CareAssistantChatResponse = {
  reply: string;
  mode: 'llm' | 'fallback' | string;
  disclaimer: string;
  plants: CareAssistantPlantSnapshot[];
};

export const CARE_ASSISTANT_PROMPTS = [
  'Takvim özetimi verir misin?',
  'Gecikmiş görevlerim var mı?',
  'Bugün ne yapmalıyım?',
  'Monstera nasıl sulanır?'
] as const;
