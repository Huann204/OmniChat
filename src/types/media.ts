export type MediaResourceType = "image" | "video" | "raw";

export interface MediaItem {
  id: string;
  url: string;
  resourceType: MediaResourceType;
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  originalFilename: string;
  createdAt: string;
}

export interface MediaUploadFailure {
  filename: string;
  error: string;
}
