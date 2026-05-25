export interface ArPreviewResponse {
  productId: number;
  productName: string;
  modelUrl: string;
  modelFormat: string;
  placementHint: string;
  suggestedScale: number;
}

export interface SaveArSessionRequestDto {
  productId: number;
  deviceModel: string;
  screenshotUrl?: string;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationY: number;
  environmentNotes?: string;
}

export interface ArSessionResponseDto {
  id: number;
  userId: number;
  customerEmail?: string | null;
  customerName?: string | null;
  productId: number;
  productName: string;
  productImageUrl: string;
  deviceModel: string;
  screenshotUrl: string;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotationY: number;
  environmentMetadata: string;
  createdDate: string;
}
