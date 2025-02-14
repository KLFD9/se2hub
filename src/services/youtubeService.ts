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

function invalidateCache() {
  localStorage.removeItem(CACHE_KEY);
}

function loadCache(pageToken: string = '', videoId?: string): VideosResponse | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const parsedCache = JSON.parse(cached) as CacheData;
  if (Date.now() - parsedCache.timestamp > CACHE_DURATION) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }

  // Si on cherche une vidéo spécifique, vérifier qu'elle existe dans le cache
  if (videoId) {
    const videoInCache = parsedCache.data.videos.some(v => v.id === videoId) ||
      Object.values(parsedCache.pageTokens).some(page => 
        page.videos.some(v => v.id === videoId)
      );
    
    // Si la vidéo n'est pas dans le cache, forcer un rechargement
    if (!videoInCache) {
      return null;
    }
  }

  if (pageToken && parsedCache.pageTokens[pageToken]) {
    return parsedCache.pageTokens[pageToken];
  }
  
  return parsedCache.data;
}

function saveCache(data: VideosResponse, pageToken: string = ''): void {
  let cacheData: CacheData;
  const existing = localStorage.getItem(CACHE_KEY);

  if (existing) {
    cacheData = JSON.parse(existing) as CacheData;
    if (pageToken) {
      cacheData.pageTokens[pageToken] = data;
    } else {
      // Fusionner les nouvelles vidéos avec les vidéos existantes
      const existingVideos = JSON.parse(existing).data.videos;
      const newVideos = data.videos;
      
      // Combiner et dédupliquer les vidéos
      const allVideos = [...existingVideos, ...newVideos];
      const uniqueVideos = allVideos.filter((video, index, self) =>
        index === self.findIndex((v) => v.id === video.id)
      );

      cacheData.data = {
        ...data,
        videos: uniqueVideos
      };
      cacheData.timestamp = Date.now();
    }
  } else {
    cacheData = {
      data,
      timestamp: Date.now(),
      pageTokens: {}
    };
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Erreur lors de la sauvegarde du cache:', e);
    // En cas d'erreur (stockage plein par exemple), on vide le cache
    invalidateCache();
  }
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

async function getVideoById(videoId: string, apiKey: string): Promise<Video | null> {
  try {
    const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videoUrl.searchParams.append('part', 'snippet,contentDetails,statistics');
    videoUrl.searchParams.append('id', videoId);
    videoUrl.searchParams.append('key', apiKey);

    const videoData = await makeYoutubeRequest(videoUrl.toString());
    if (!videoData.items || videoData.items.length === 0) {
      return null;
    }

    const item = videoData.items[0];
    const channelId = item.snippet.channelId;

    // Récupérer les informations de la chaîne
    const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
    channelUrl.searchParams.append('part', 'snippet');
    channelUrl.searchParams.append('id', channelId);
    channelUrl.searchParams.append('key', apiKey);

    const channelData = await makeYoutubeRequest(channelUrl.toString());
    const channelThumbnailUrl = channelData.items?.[0]?.snippet?.thumbnails?.default?.url;

    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.maxres?.url || 
                   item.snippet.thumbnails.high?.url || 
                   item.snippet.thumbnails.medium?.url,
      channelTitle: item.snippet.channelTitle,
      channelId: channelId,
      channelThumbnailUrl,
      duration: formatDuration(item.contentDetails.duration),
      viewCount: item.statistics.viewCount,
      publishedAt: item.snippet.publishedAt,
      likeCount: item.statistics.likeCount
    };
  } catch (error) {
    console.error('Error fetching video by ID:', error);
    return null;
  }
}

export async function getSpaceEngineers2Videos(pageToken: string = '', requestedVideoId?: string): Promise<VideosResponse> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  // Si on cherche une vidéo spécifique, essayer de la récupérer directement
  if (requestedVideoId) {
    const video = await getVideoById(requestedVideoId, apiKey);
    if (video) {
      // Récupérer quelques vidéos supplémentaires pour les recommandations
      const response = await getSpaceEngineers2Videos();
      return {
        videos: [video, ...response.videos.filter(v => v.id !== requestedVideoId)],
        nextPageToken: response.nextPageToken
      };
    }
  }

  // Vérifier le cache seulement si on ne cherche pas une vidéo spécifique
  if (!requestedVideoId) {
    const cachedData = loadCache(pageToken);
    if (cachedData) {
      console.log("Returning cached data");
      return cachedData;
    }
  }

  console.log("Fetching fresh data from API", requestedVideoId ? "for video: " + requestedVideoId : "");
  
  const maxResults = requestedVideoId ? 50 : 12; // Augmenter la limite pour trouver une vidéo spécifique

  try {
    console.group("YouTube API Request");
    
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', '"Space Engineers 2" gameplay');
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('key', apiKey);
    
    // Si on cherche une vidéo spécifique, ajuster les paramètres de recherche
    if (requestedVideoId) {
      searchUrl.searchParams.append('order', 'date'); // Plus récent d'abord
    }

    if (pageToken) {
      searchUrl.searchParams.append('pageToken', pageToken);
    }

    const searchData = await makeYoutubeRequest(searchUrl.toString());
    
    if (!searchData.items || searchData.items.length === 0) {
      console.log("No videos found in search results");
      return { videos: [], nextPageToken: undefined };
    }

    const videoIds = searchData.items
      .filter((item: any) => item.id && item.id.videoId)
      .map((item: any) => item.id.videoId)
      .join(',');

    if (!videoIds) {
      console.log("No valid video IDs found");
      return { videos: [], nextPageToken: undefined };
    }

    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.append('part', 'snippet,contentDetails,statistics');
    detailsUrl.searchParams.append('id', videoIds);
    detailsUrl.searchParams.append('key', apiKey);
    detailsUrl.searchParams.append('fields', 'items(id,snippet(title,description,thumbnails,channelTitle,channelId,publishedAt),contentDetails/duration,statistics(viewCount,likeCount))');

    const detailsData = await makeYoutubeRequest(detailsUrl.toString());

    if (!detailsData.items || detailsData.items.length === 0) {
      console.log("No video details found");
      return { videos: [], nextPageToken: undefined };
    }

    // Récupérer les IDs des chaînes uniques
    const channelIds = [...new Set(detailsData.items
      .filter((item: any) => item.snippet && item.snippet.channelId)
      .map((item: any) => item.snippet.channelId))]
      .join(',');

    let channelAvatars = new Map();
    if (channelIds) {
      const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      channelsUrl.searchParams.append('part', 'snippet');
      channelsUrl.searchParams.append('id', channelIds);
      channelsUrl.searchParams.append('key', apiKey);
      channelsUrl.searchParams.append('fields', 'items(id,snippet/thumbnails)');

      try {
        const channelsData = await makeYoutubeRequest(channelsUrl.toString());
        if (channelsData.items) {
          channelAvatars = new Map(
            channelsData.items.map((channel: any) => [
              channel.id,
              channel.snippet.thumbnails?.default?.url ||
              channel.snippet.thumbnails?.medium?.url ||
              undefined
            ])
          );
        }
      } catch (error) {
        console.warn('Error fetching channel avatars:', error);
        // Continue without avatars
      }
    }

    // Transformer les données en format Video
    const videos: Video[] = detailsData.items
      .filter((item: any) => {
        // Vérifier que toutes les propriétés requises existent
        return item.id &&
          item.snippet?.title &&
          item.snippet?.channelTitle &&
          item.snippet?.channelId &&
          (item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url);
      })
      .map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description || '',
        thumbnailUrl: item.snippet.thumbnails.maxres?.url || 
                     item.snippet.thumbnails.high?.url || 
                     item.snippet.thumbnails.medium?.url || 
                     item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        channelThumbnailUrl: channelAvatars.get(item.snippet.channelId),
        duration: formatDuration(item.contentDetails?.duration || 'PT0S'),
        viewCount: item.statistics?.viewCount || '0',
        publishedAt: item.snippet.publishedAt,
        likeCount: item.statistics?.likeCount || '0'
      }));

    const response = {
      videos,
      nextPageToken: searchData.nextPageToken
    };

    // Sauvegarder dans le cache uniquement la première page
    if (!pageToken) {
      saveCache(response);
    }

    console.groupEnd();
    return response;

  } catch (error) {
    console.error('Error fetching videos:', error);
    // Vérifier si l'erreur est liée au quota
    if (error instanceof Error && 
      (error.message.includes('quota') || error.message.includes('403'))) {
      // Essayer de retourner les données en cache même si elles sont expirées
      const cachedData = loadCache(pageToken);
      if (cachedData) {
        console.log("Returning expired cached data due to quota error");
        return cachedData;
      }
    }
    throw error;
  }
}
