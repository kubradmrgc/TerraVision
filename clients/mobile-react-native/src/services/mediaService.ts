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

export const mediaService = {
  async uploadArModelForProduct(
    productId: number,
    file: UploadFileInput,
    options?: UploadOptions
  ): Promise<UploadArModelResult> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type
    } as unknown as Blob);

    const { data } = await apiClient.post<UploadArModelResult>(
      `/api/media/ar-models?productId=${productId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
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
};
