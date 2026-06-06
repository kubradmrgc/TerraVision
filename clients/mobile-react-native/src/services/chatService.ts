import { createChatService } from '@terravision/shared';
import { apiClient } from './apiClient';

export const chatService = createChatService(apiClient);
