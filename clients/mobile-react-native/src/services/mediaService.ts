import {
  API_ROUTES,
  uploadWithPresignFallback,
  type PresignUploadResponse
} from '@terravision/shared';
import { apiClient } from './apiClient';

export interface UploadArModelResult {
  uploaded: {
    fileName: string;
    url: string;
    size: number;
  };
  product: {
    id: number;
    name: string;
    arModelFileName?: string;
    isArCompatible: boolean;
  } | null;
}

export interface UploadFileInput {
  uri: string;
  name: string;
  type: string;
}

type UploadOptions = {
  onProgress?: (percent: number) => void;
};

async function readUploadBlob(file: UploadFileInput): Promise<Blob> {
  const response = await fetch(file.uri);
  return response.blob();
}

export const mediaService = {
  async uploadArModelForProduct(
    productId: number,
    file: UploadFileInput,
    options?: UploadOptions
  ): Promise<UploadArModelResult> {
    const blob = await readUploadBlob(file);

    return uploadWithPresignFallback({
      fetchPresign: async () => {
        const { data } = await apiClient.post<PresignUploadResponse>(API_ROUTES.mediaArModelsPresign, {
          fileName: file.name,
          contentType: file.type,
          contentLength: blob.size
        });
        return data;
      },
      getBody: async () => blob,
      contentLength: blob.size,
      confirm: async (confirm) => {
        const { data } = await apiClient.post<UploadArModelResult>(
          `${API_ROUTES.mediaArModelsConfirm}?productId=${productId}`,
          confirm
        );
        return data;
      },
      directUpload: async () => {
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type
        } as unknown as Blob);

        const { data } = await apiClient.post<UploadArModelResult>(
          `${API_ROUTES.mediaArModels}?productId=${productId}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (event) => {
              if (!options?.onProgress || !event.total) {
                return;
              }
              const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
              options.onProgress(percent);
            }
          }
        );
        return data;
      }
    });
  }
};
