// src/types/Video.ts
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;  // Renommé de thumbnail
  channelTitle: string;
  channelId: string;
  channelThumbnailUrl?: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
}
