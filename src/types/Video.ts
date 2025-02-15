// src/types/Video.ts
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId: string;
  channelThumbnailUrl?: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  subscriberCount?: string;
  likeCount: string;
}

export interface RecommendedVideosProps {
  videos: Video[];
  currentVideoId?: string;
}