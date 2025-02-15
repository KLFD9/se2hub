import { Video } from "../types/Video";

export interface VideosResponse {
  videos: Video[];
  nextPageToken?: string;
}

const DURATION_REGEX = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
const CACHE_KEY = "yt_v3_cache";
const CACHE_TTL = 14400000;
const API_ENDPOINTS = {
  VIDEOS: "https://www.googleapis.com/youtube/v3/videos",
  SEARCH: "https://www.googleapis.com/youtube/v3/search",
  CHANNELS: "https://www.googleapis.com/youtube/v3/channels",
};

interface CacheState {
  videosMap: Record<string, Video>;
  pageMap: Record<string, { ids: string[]; nextToken?: string }>;
  timestamp: number;
}

function formatDuration(duration: string): string {
  const { H = 0, M = 0, S = 0 } = duration.match(DURATION_REGEX)?.groups || {};
  return [Number(H) > 0 ? H : null, String(M).padStart(Number(H) > 0 ? 2 : 1, "0"), String(S).padStart(2, "0")]
    .filter(Boolean)
    .join(":");
}

function createCacheManager() {
  const getCache = (): CacheState | null => {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return parsed && Date.now() - parsed.timestamp < CACHE_TTL ? parsed : null;
    } catch {
      return null;
    }
  };

  const saveCache = (videos: Video[], nextToken?: string, pageToken = "") => {
    const cache = getCache() || { videosMap: {}, pageMap: {}, timestamp: 0 };
    const newMap = videos.reduce((acc, v) => ({ ...acc, [v.id]: v }), {});

    cache.videosMap = { ...cache.videosMap, ...newMap };
    cache.pageMap[pageToken] = { ids: videos.map((v) => v.id), nextToken };
    cache.timestamp = Date.now();

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
  };

  const loadCache = (pageToken = ""): VideosResponse | null => {
    const cache = getCache();
    if (!cache?.pageMap?.[pageToken]?.ids) return null;

    const pageData = cache.pageMap[pageToken];
    const videos = pageData.ids
      .map(id => cache.videosMap?.[id])
      .filter((v): v is Video => v !== undefined);

    if (videos.length === 0) return null;

    return {
      videos,
      nextPageToken: pageData.nextToken
    };
  };

  return { saveCache, loadCache };
}

const { saveCache, loadCache } = createCacheManager();

async function fetchAPI<T>(url: URL, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.status } }));
    throw new Error(error.error.message);
  }

  return response.json();
}

async function fetchVideoDetails(ids: string[], apiKey: string, signal?: AbortSignal) {
  if (!ids.length) return [];

  const url = new URL(API_ENDPOINTS.VIDEOS);
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("key", apiKey);
  url.searchParams.set("fields", "items(id,snippet,contentDetails/duration,statistics)");

  const data = await fetchAPI<{ items: any[] }>(url, signal);
  return data.items || [];
}

async function fetchChannelAvatars(ids: string[], apiKey: string, signal?: AbortSignal) {
  if (!ids.length) return new Map<string, string>();

  const url = new URL(API_ENDPOINTS.CHANNELS);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("key", apiKey);
  url.searchParams.set("fields", "items(id,snippet/thumbnails/default/url)");

  try {
    const data = await fetchAPI<{ items: any[] }>(url, signal);
    return new Map(data.items?.map((c) => [c.id, c.snippet.thumbnails?.default?.url]));
  } catch {
    return new Map();
  }
}

export async function getSpaceEngineers2Videos(
  pageToken = "",
  requestedId?: string
): Promise<VideosResponse> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  if (requestedId) {
    try {
      const video = await getVideoById(requestedId, apiKey);
      if (!video) throw new Error("VIDEO_NOT_FOUND");
      
      const response = await getSpaceEngineers2Videos();
      return {
        videos: [video, ...response.videos.filter((v) => v.id !== requestedId)],
        nextPageToken: response.nextPageToken,
      };
    } catch {
      return { videos: [], nextPageToken: undefined };
    }
  }

  const cached = loadCache(pageToken);
  if (cached) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const searchUrl = new URL(API_ENDPOINTS.SEARCH);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", "Space Engineers 2");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("order", "date");
    searchUrl.searchParams.set("maxResults", "50");
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("pageToken", pageToken);
    searchUrl.searchParams.set("fields", "items(id/videoId),nextPageToken");

    const searchData = await fetchAPI<{ items: any[]; nextPageToken?: string }>(searchUrl, controller.signal);
    const videoIds = searchData.items?.map((i) => i.id.videoId).filter(Boolean) || [];
    
    if (!videoIds.length) return { videos: [], nextPageToken: undefined };

    const details = await fetchVideoDetails(videoIds, apiKey, controller.signal);

    details.sort((a, b) => 
      new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime()
    );

    const channelIds = [...new Set(details.map((d) => d.snippet?.channelId).filter(Boolean))];
    const avatars = await fetchChannelAvatars(channelIds, apiKey, controller.signal);

    const videos = details.map((item) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description || "",
      thumbnailUrl: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      channelThumbnailUrl: avatars.get(item.snippet.channelId),
      duration: formatDuration(item.contentDetails?.duration || "PT0S"),
      viewCount: item.statistics?.viewCount || "0",
      publishedAt: item.snippet.publishedAt,
      likeCount: item.statistics?.likeCount || "0",
    })).filter((v) => v.thumbnailUrl);

    saveCache(videos, searchData.nextPageToken, pageToken);

    return { 
      videos, 
      nextPageToken: searchData.nextPageToken 
    };

  } catch (error) {
    console.error(`[YT Service Error] ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error && error.message.includes("quota exceeded")) {
      const fallback = loadCache(pageToken);
      return fallback || { videos: [], nextPageToken: undefined };
    }
    throw error;
  }
}

async function getVideoById(id: string, apiKey: string): Promise<Video | null> {
  try {
    const [video] = await fetchVideoDetails([id], apiKey);
    if (!video) return null;

    const avatars = await fetchChannelAvatars([video.snippet.channelId], apiKey);
    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      channelThumbnailUrl: avatars.get(video.snippet.channelId),
      duration: formatDuration(video.contentDetails.duration),
      viewCount: video.statistics.viewCount,
      publishedAt: video.snippet.publishedAt,
      likeCount: video.statistics.likeCount,
    };
  } catch {
    return null;
  }
}