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
const CACHE_DURATION = 1000 * 60 * 60; // 1 heure

interface CacheData {
  data: VideosResponse;
  timestamp: number;
}

function loadCache(): CacheData | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const parsedCache = JSON.parse(cached) as CacheData;
    if (Date.now() - parsedCache.timestamp < CACHE_DURATION) {
      return parsedCache;
    }
    localStorage.removeItem(CACHE_KEY);
  }
  return null;
}

function saveCache(data: VideosResponse): void {
  const cacheData: CacheData = {
    data,
    timestamp: Date.now()
  };
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
  // Vérifier le cache pour la première page
  if (!pageToken) {
    const cachedData = loadCache();
    if (cachedData) {
      console.log("Returning cached data from localStorage");
      return cachedData.data;
    }
  }

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const query = "Space Engineers 2";
  const maxResults = 5;

  try {
    console.group("YouTube API Request");
    
    // Construction de l'URL de recherche
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('relevanceLanguage', 'fr');
    if (pageToken) {
      searchUrl.searchParams.append('pageToken', pageToken);
    }

    console.log("Search URL:", searchUrl.toString());
    const searchData = await makeYoutubeRequest(searchUrl.toString());

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    if (!videoIds) {
      console.log("No video IDs found");
      return { videos: [] };
    }

    console.group("YouTube Video Details Request");
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.append('part', 'snippet,contentDetails,statistics');
    detailsUrl.searchParams.append('id', videoIds);
    detailsUrl.searchParams.append('key', apiKey);
    detailsUrl.searchParams.append('fields', 'items(id,snippet(title,description,thumbnails,channelTitle,channelId),contentDetails/duration,statistics/viewCount)');

    console.log("Details URL:", detailsUrl.toString());
    const detailsData = await makeYoutubeRequest(detailsUrl.toString());
    console.groupEnd();

    // Filtrer les vidéos selon la catégorie et le titre
    const filteredVideos = detailsData.items.filter((item: any) => {
      const snippet = item.snippet;
      return snippet.categoryId === "20" &&
             snippet.title.toLowerCase().includes("space") &&
             snippet.title.toLowerCase().includes("engineers");
    });
    console.group("Filtered Videos");
    console.log("Nombre de vidéos filtrées:", filteredVideos.length);
    console.groupEnd();

    // Récupérer les IDs de chaîne uniques
    const channelIds = Array.from(new Set(filteredVideos.map((item: any) => item.snippet.channelId)));
    let channelThumbnails: { [key: string]: string } = {};
    if (channelIds.length > 0) {
      console.group("YouTube Channels Request");
      const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      channelsUrl.searchParams.append('part', 'snippet');
      channelsUrl.searchParams.append('id', channelIds.join(','));
      channelsUrl.searchParams.append('key', apiKey);
      channelsUrl.searchParams.append('fields', 'items(id,snippet/thumbnails)');

      console.log("Channels URL:", channelsUrl.toString());
      const channelsData = await makeYoutubeRequest(channelsUrl.toString());
      channelsData.items.forEach((channel: any) => {
        channelThumbnails[channel.id] = channel.snippet.thumbnails?.default?.url || channel.snippet.thumbnails?.high?.url || "";
      });
      console.groupEnd();
    }

    // Construire le tableau final de vidéos avec les données enrichies
    const videos: Video[] = filteredVideos.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      duration: formatDuration(item.contentDetails.duration),
      keywords: item.snippet.tags || [],
      category: "Gaming",
      channelTitle: item.snippet.channelTitle,
      channelThumbnailUrl: channelThumbnails[item.snippet.channelId] || "",
      viewCount: item.statistics?.viewCount || "0"
    }));

    const response = { videos, nextPageToken: searchData.nextPageToken };
    
    // Mettre en cache seulement la première page
    if (!pageToken) {
      saveCache(response);
    }
    
    return response;
  } catch (error) {
    console.group("YouTube API Error");
    console.error(error);
    console.groupEnd();
    return { videos: [] };
  }
}
