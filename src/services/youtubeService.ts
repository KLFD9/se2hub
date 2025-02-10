// src/services/youtubeService.ts
import { Video } from "../types/Video";

export interface VideosResponse {
  videos: Video[];
  nextPageToken?: string;
}

function formatDuration(isoDuration: string): string {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return '00:00';
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

const CACHE_KEY = 'youtube_videos_cache';
const CACHE_DURATION = 1000 * 60 * 60 * 4; // 4 heures de cache

interface CacheData {
  data: VideosResponse;
  timestamp: number;
  pageTokens: {
    [key: string]: VideosResponse;
  };
}

function loadCache(pageToken: string = ''): VideosResponse | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const parsedCache = JSON.parse(cached) as CacheData;
    if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
      if (pageToken && parsedCache.pageTokens[pageToken]) {
        return parsedCache.pageTokens[pageToken];
      } else if (!pageToken) {
        return parsedCache.data;
      }
    } else {
      localStorage.removeItem(CACHE_KEY);
    }
  }
  return null;
}

function saveCache(data: VideosResponse, pageToken: string = ''): void {
  let cacheData: CacheData;
  const existing = localStorage.getItem(CACHE_KEY);

  if (existing) {
    cacheData = JSON.parse(existing) as CacheData;
    if (pageToken) {
      cacheData.pageTokens[pageToken] = data;
    } else {
      cacheData.data = data;
      cacheData.timestamp = Date.now();
    }
  } else {
    cacheData = {
      data,
      timestamp: Date.now(),
      pageTokens: {}
    };
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
}

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Origin': window.location.origin,
  'Referer': `${window.location.origin}/`
};

async function makeYoutubeRequest(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: DEFAULT_HEADERS,
    mode: 'cors',
    credentials: 'omit'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.error?.message || `Error: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getSpaceEngineers2Videos(pageToken: string = ''): Promise<VideosResponse> {
  // Vérifier le cache
  const cachedData = loadCache(pageToken);
  if (cachedData) {
    console.log("Returning cached data from localStorage", pageToken ? "for page token: " + pageToken : "for first page");
    return cachedData;
  }

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const maxResults = 12;

  try {
    console.group("YouTube API Request");
    
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', '"Space Engineers 2" gameplay');
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('order', 'date'); // Trier par date
    searchUrl.searchParams.append('videoDefinition', 'high'); // Uniquement les vidéos HD
    searchUrl.searchParams.append('publishedAfter', new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()); // Dernier mois

    if (pageToken) {
      searchUrl.searchParams.append('pageToken', pageToken);
    }

    const searchData = await makeYoutubeRequest(searchUrl.toString());
    
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');
    if (!videoIds) {
      console.log("No video IDs found");
      return { videos: [], nextPageToken: undefined };
    }

    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.append('part', 'snippet,contentDetails,statistics');
    detailsUrl.searchParams.append('id', videoIds);
    detailsUrl.searchParams.append('key', apiKey);
    detailsUrl.searchParams.append('fields', 'items(id,snippet(title,description,thumbnails,channelTitle,channelId,publishedAt),contentDetails/duration,statistics/viewCount)');

    const detailsData = await makeYoutubeRequest(detailsUrl.toString());

    // Récupérer les IDs des chaînes uniques
    const channelIds = [...new Set(detailsData.items.map((item: any) => item.snippet.channelId))].join(',');

    // Récupérer les avatars des chaînes en une seule requête
    const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
    channelsUrl.searchParams.append('part', 'snippet');
    channelsUrl.searchParams.append('id', channelIds);
    channelsUrl.searchParams.append('key', apiKey);
    channelsUrl.searchParams.append('fields', 'items(id,snippet/thumbnails)');

    const channelsData = await makeYoutubeRequest(channelsUrl.toString());
    const channelAvatars = new Map(
      channelsData.items.map((channel: any) => [
        channel.id,
        channel.snippet.thumbnails.default?.url ||
        channel.snippet.thumbnails.medium?.url ||
        undefined
      ])
    );

    // Transformer les données en format Video
    const videos: Video[] = detailsData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.maxres?.url || 
                   item.snippet.thumbnails.high?.url || 
                   item.snippet.thumbnails.medium?.url || 
                   item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      channelThumbnailUrl: channelAvatars.get(item.snippet.channelId),
      duration: formatDuration(item.contentDetails.duration),
      viewCount: item.statistics.viewCount,
      publishedAt: item.snippet.publishedAt
    }));

    const response = {
      videos,
      nextPageToken: searchData.nextPageToken
    };

    // Sauvegarder dans le cache uniquement la première page
    saveCache(response, pageToken);

    console.groupEnd();
    return response;

  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
}
