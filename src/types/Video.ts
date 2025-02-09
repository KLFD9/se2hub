// src/types/Video.ts
export interface Video {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    publishedAt: string;
    duration?: string;
    keywords?: string[];
    category?: string;
    channelTitle?: string;
    channelThumbnailUrl?: string;
    viewCount?: string;
    language?: string;
  }
  