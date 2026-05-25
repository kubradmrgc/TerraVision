import {
  API_ROUTES,
  SaveArSessionRequestDto,
  ArSessionResponseDto,
  putFileToPresignedUrl,
  type PresignUploadResponse
} from '@terravision/shared';
import { apiClient } from './apiClient';
import { UploadFileInput } from './mediaService';

export type SaveArSessionInput = SaveArSessionRequestDto & {
  screenshot: UploadFileInput;
};

type SaveOptions = {
  onProgress?: (percent: number) => void;
};

async function readUploadBlob(file: UploadFileInput): Promise<Blob> {
  const response = await fetch(file.uri);
  return response.blob();
}

function buildSessionForm(payload: SaveArSessionInput, screenshotUrl?: string): FormData {
  const formData = new FormData();
  formData.append('productId', String(payload.productId));
  formData.append('deviceModel', payload.deviceModel);
  formData.append('scaleX', String(payload.scaleX));
  formData.append('scaleY', String(payload.scaleY));
  formData.append('scaleZ', String(payload.scaleZ));
  formData.append('rotationY', String(payload.rotationY));
  if (payload.environmentNotes) {
    formData.append('environmentNotes', payload.environmentNotes);
  }
  if (screenshotUrl) {
    formData.append('screenshotUrl', screenshotUrl);
  }
  return formData;
}

export const arSessionService = {
  async saveSession(payload: SaveArSessionInput, options?: SaveOptions): Promise<ArSessionResponseDto> {
    const screenshotBlob = await readUploadBlob(payload.screenshot);

    try {
      const { data: presignResponse } = await apiClient.post<PresignUploadResponse>(
        API_ROUTES.mediaArScreenshotsPresign,
        {
          fileName: payload.screenshot.name,
          contentType: payload.screenshot.type,
          contentLength: screenshotBlob.size
        }
      );

      if (presignResponse.supported && presignResponse.presign) {
        await putFileToPresignedUrl(presignResponse.presign, screenshotBlob);
        const formData = buildSessionForm(payload, presignResponse.presign.publicUrl);
        const { data } = await apiClient.post<ArSessionResponseDto>(API_ROUTES.AR.saveSession, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
      }
    } catch {
      // fall through to API multipart upload (Local storage or presign unavailable)
    }

    const formData = buildSessionForm(payload);
    formData.append('screenshot', {
      uri: payload.screenshot.uri,
      name: payload.screenshot.name,
      type: payload.screenshot.type
    } as unknown as Blob);

    const { data } = await apiClient.post<ArSessionResponseDto>(API_ROUTES.AR.saveSession, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!options?.onProgress || !event.total) {
          return;
        }
        const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
        options.onProgress(percent);
      }
    });

    return data;
  },

  async getMySessions(): Promise<ArSessionResponseDto[]> {
    const { data } = await apiClient.get<ArSessionResponseDto[]>(API_ROUTES.AR.getMySessions);
    return data;
  }
};
