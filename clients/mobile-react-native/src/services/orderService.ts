import { createOrderService } from '@terravision/shared';
import { apiClient } from './apiClient';

export const orderService = createOrderService(apiClient);
