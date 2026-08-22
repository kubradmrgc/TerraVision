export type PresignUploadDetails = {
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  objectKey: string;
  fileName: string;
  publicUrl: string;
  expiresAtUtc: string;
};

export type PresignUploadResponse = {
  supported: boolean;
  presign?: PresignUploadDetails;
};

export type ConfirmPresignedUpload = {
  objectKey: string;
  fileName: string;
  contentLength?: number;
};

export type PresignUploadRequest = {
  fileName: string;
  contentType: string;
  contentLength: number;
};

export async function putFileToPresignedUrl(
  presign: PresignUploadDetails,
  body: Blob | ArrayBuffer
): Promise<void> {
  const response = await fetch(presign.uploadUrl, {
    method: presign.method || 'PUT',
    headers: presign.headers,
    body
  });

  if (!response.ok) {
    throw new Error(`Direct upload failed (${response.status}).`);
  }
}

export async function uploadWithPresignFallback<TUploaded>(options: {
  fetchPresign: () => Promise<PresignUploadResponse>;
  getBody: () => Promise<Blob | ArrayBuffer>;
  contentLength: number;
  confirm: (confirm: ConfirmPresignedUpload) => Promise<TUploaded>;
  directUpload: () => Promise<TUploaded>;
}): Promise<TUploaded> {
  const presignResponse = await options.fetchPresign();
  if (!presignResponse.supported || !presignResponse.presign) {
    return options.directUpload();
  }

  const body = await options.getBody();
  await putFileToPresignedUrl(presignResponse.presign, body);
  return options.confirm({
    objectKey: presignResponse.presign.objectKey,
    fileName: presignResponse.presign.fileName,
    contentLength: options.contentLength
  });
}
