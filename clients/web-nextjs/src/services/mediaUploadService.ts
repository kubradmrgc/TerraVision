import {
  API_ROUTES,
  putFileToPresignedUrl,
  uploadWithPresignFallback,
  type ConfirmPresignedUpload,
  type PresignUploadRequest,
  type PresignUploadResponse
} from '@terravision/shared';
import { apiClient } from './apiClient';

export type UploadedMedia = {
  fileName: string;
  url: string;
  size: number;
};

export const mediaUploadService = {
  async uploadProductImage(file: File, productId?: number): Promise<{ uploaded: UploadedMedia; product: unknown }> {
    return uploadWithPresignFallback({
      fetchPresign: async () => {
        const { data } = await apiClient.post<PresignUploadResponse>(API_ROUTES.mediaProductImagesPresign, {
          fileName: file.name,
          contentType: file.type,
          contentLength: file.size
        } satisfies PresignUploadRequest);
        return data;
      },
      getBody: async () => file,
      contentLength: file.size,
      confirm: async (confirm: ConfirmPresignedUpload) => {
        const query = productId ? `?productId=${productId}` : '';
        const { data } = await apiClient.post<{ uploaded: UploadedMedia; product: unknown }>(
          `${API_ROUTES.mediaProductImagesConfirm}${query}`,
          confirm
        );
        return data;
      },
      directUpload: async () => {
        const formData = new FormData();
        formData.append('file', file);
        const query = productId ? `?productId=${productId}` : '';
        const { data } = await apiClient.post<{ uploaded: UploadedMedia; product: unknown }>(
          `${API_ROUTES.mediaProductImages}${query}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return data;
      }
    });
  },

  async putPresigned(file: File, presign: NonNullable<PresignUploadResponse['presign']>): Promise<void> {
    await putFileToPresignedUrl(presign, file);
  }
};
