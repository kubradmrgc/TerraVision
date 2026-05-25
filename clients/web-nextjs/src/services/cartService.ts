import { createCartService } from '@terravision/shared';
import { apiClient } from './apiClient';

export const cartService = createCartService(apiClient);
