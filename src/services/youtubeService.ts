// src/services/youtubeService.ts

import { Video } from "../types/Video";

export interface VideosResponse {
  videos: Video[];
  nextPageToken?: string;
}

/* --------------------------------------------------
   1. FORMATAGE DE LA DURÉE YOUTUBE (PT..S -> HH:MM:SS)
-------------------------------------------------- */
function formatYoutubeDuration(isoDuration: string): string {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return "00:00";

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/* --------------------------------------------------
   2. GESTION DU CACHE LOCALSTORAGE
-------------------------------------------------- */
const CACHE_KEY = "youtube_videos_cache";
const CACHE_DURATION = 1000 * 60 * 60 * 4; // 4 heures de cache

interface CacheData {
  data: VideosResponse;
  timestamp: number;
  pageTokens: Record<string, VideosResponse>;
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Charge les données depuis le cache local.
 * @param pageToken  Token de page pour la pagination.
 * @param videoId    Identifiant de vidéo spécifique (facultatif).
 * @returns          Données trouvées ou null si absentes / expirées.
 */
function loadCache(pageToken = "", videoId?: string): VideosResponse | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached) as CacheData;
    // Vérifie si le cache est expiré
    if (Date.now() - parsedCache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Vérifie si la vidéo demandée existe dans le cache
    if (videoId) {
      const videoInCache =
        parsedCache.data.videos.some((v) => v.id === videoId) ||
        Object.values(parsedCache.pageTokens).some((page) =>
          page.videos.some((v) => v.id === videoId)
        );
      if (!videoInCache) {
        return null;
      }
    }

    // Retourne la page demandée si elle existe
    if (pageToken && parsedCache.pageTokens[pageToken]) {
      return parsedCache.pageTokens[pageToken];
    }

    return parsedCache.data;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde des données dans le cache local en fusionnant
 * toujours les nouvelles vidéos dans la liste principale.
 * @param data       Données à sauvegarder.
 * @param pageToken  Token de page pour la pagination.
 */
function saveCache(data: VideosResponse, pageToken = ""): void {
  try {
    const existing = localStorage.getItem(CACHE_KEY);
    let cacheData: CacheData;

    if (existing) {
      cacheData = JSON.parse(existing) as CacheData;

      // 1. Fusion des vidéos avec celles déjà présentes
      const existingVideos = cacheData.data.videos;
      const newVideos = data.videos;

      // 2. Combiner et dédupliquer
      const allVideos = [...existingVideos, ...newVideos];
      const uniqueVideos = allVideos.filter(
        (video, index, self) =>
          index === self.findIndex((v) => v.id === video.id)
      );

      // 3. Mettre à jour la liste principale et le nextPageToken
      cacheData.data = {
        videos: uniqueVideos,
        nextPageToken: data.nextPageToken,
      };
      cacheData.timestamp = Date.now();

      // 4. Enregistrer également cette page spécifique
      cacheData.pageTokens[pageToken] = {
        videos: uniqueVideos,
        nextPageToken: data.nextPageToken,
      };
    } else {
      // Création d'un nouveau cache
      cacheData = {
        data,
        timestamp: Date.now(),
        pageTokens: {},
      };
      // Enregistrer la page dans pageTokens
      cacheData.pageTokens[pageToken] = data;
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch {
    clearCache();
  }
}

/* --------------------------------------------------
   3. FONCTION DE REQUÊTE GLOBALE À L'API YOUTUBE
-------------------------------------------------- */
const DEFAULT_HEADERS = {
  Accept: "application/json",
  Origin: window.location.origin,
  Referer: `${window.location.origin}/`,
};

async function makeYoutubeRequest(url: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: DEFAULT_HEADERS,
    mode: "cors",
    credentials: "omit",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.error?.message || `Error: ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
}

/* --------------------------------------------------
   4. RÉCUPÉRER LES DÉTAILS D'UNE VIDÉO PAR ID
-------------------------------------------------- */
async function getVideoById(
  videoId: string,
  apiKey: string
): Promise<Video | null> {
  try {
    const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videoUrl.searchParams.append("part", "snippet,contentDetails,statistics");
    videoUrl.searchParams.append("id", videoId);
    videoUrl.searchParams.append("key", apiKey);

    const videoData = await makeYoutubeRequest(videoUrl.toString());
    if (!videoData.items || videoData.items.length === 0) {
      return null;
    }

    const item = videoData.items[0];
    const channelId = item.snippet.channelId;

    // Récupérer la miniature de la chaîne
    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelUrl.searchParams.append("part", "snippet");
    channelUrl.searchParams.append("id", channelId);
    channelUrl.searchParams.append("key", apiKey);

    const channelData = await makeYoutubeRequest(channelUrl.toString());
    const channelThumbnailUrl =
      channelData.items?.[0]?.snippet?.thumbnails?.default?.url;

    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails.maxres?.url ||
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url,
      channelTitle: item.snippet.channelTitle,
      channelId: channelId,
      channelThumbnailUrl,
      duration: formatYoutubeDuration(item.contentDetails.duration),
      viewCount: item.statistics.viewCount,
      publishedAt: item.snippet.publishedAt,
      likeCount: item.statistics.likeCount,
    };
  } catch {
    return null;
  }
}

/* --------------------------------------------------
   5. RÉCUPÉRER LES VIDÉOS "SPACE ENGINEERS 2"
-------------------------------------------------- */
export async function getSpaceEngineers2Videos(
  pageToken = "",
  requestedVideoId?: string
): Promise<VideosResponse> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  // 5.1 - Cas d'une vidéo spécifique
  if (requestedVideoId) {
    const video = await getVideoById(requestedVideoId, apiKey);
    if (video) {
      // Récupérer quelques vidéos supplémentaires pour recommandations
      const response = await getSpaceEngineers2Videos();
      return {
        videos: [video, ...response.videos.filter((v) => v.id !== requestedVideoId)],
        nextPageToken: response.nextPageToken,
      };
    }
  }

  // 5.2 - Vérifier le cache uniquement si pas de vidéo spécifique
  if (!requestedVideoId) {
    const cachedData = loadCache(pageToken);
    if (cachedData) {
      // On retourne immédiatement le cache
      return cachedData;
    }
  }

  // 5.3 - Pas de cache ou besoin de données fraîches
  const maxResults = requestedVideoId ? 50 : 12;

  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.append("part", "snippet");
    searchUrl.searchParams.append("q", '"Space Engineers 2" gameplay');
    searchUrl.searchParams.append("type", "video");
    searchUrl.searchParams.append("maxResults", maxResults.toString());
    searchUrl.searchParams.append("key", apiKey);

    if (requestedVideoId) {
      searchUrl.searchParams.append("order", "date");
    }

    if (pageToken) {
      searchUrl.searchParams.append("pageToken", pageToken);
    }

    const searchData = await makeYoutubeRequest(searchUrl.toString());
    if (!searchData.items || searchData.items.length === 0) {
      return { videos: [], nextPageToken: undefined };
    }

    const videoIds = searchData.items
      .filter((item: any) => item.id && item.id.videoId)
      .map((item: any) => item.id.videoId)
      .join(",");

    if (!videoIds) {
      return { videos: [], nextPageToken: undefined };
    }

    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.searchParams.append("part", "snippet,contentDetails,statistics");
    detailsUrl.searchParams.append("id", videoIds);
    detailsUrl.searchParams.append("key", apiKey);
    detailsUrl.searchParams.append(
      "fields",
      "items(id,snippet(title,description,thumbnails,channelTitle,channelId,publishedAt),contentDetails/duration,statistics(viewCount,likeCount))"
    );

    const detailsData = await makeYoutubeRequest(detailsUrl.toString());
    if (!detailsData.items || detailsData.items.length === 0) {
      return { videos: [], nextPageToken: undefined };
    }

    // Récupération des miniatures de chaînes
    const channelIds = [
      ...new Set(
        detailsData.items
          .filter((item: any) => item.snippet?.channelId)
          .map((item: any) => item.snippet.channelId)
      ),
    ].join(",");

    let channelAvatars = new Map();
    if (channelIds) {
      const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
      channelsUrl.searchParams.append("part", "snippet");
      channelsUrl.searchParams.append("id", channelIds);
      channelsUrl.searchParams.append("key", apiKey);
      channelsUrl.searchParams.append("fields", "items(id,snippet/thumbnails)");

      try {
        const channelsData = await makeYoutubeRequest(channelsUrl.toString());
        if (channelsData.items) {
          channelAvatars = new Map(
            channelsData.items.map((channel: any) => [
              channel.id,
              channel.snippet.thumbnails?.default?.url ||
                channel.snippet.thumbnails?.medium?.url ||
                undefined,
            ])
          );
        }
      } catch {
        // on continue sans avatars
      }
    }

    // Conversion en format Video
    const videos: Video[] = detailsData.items
      .filter((item: any) => {
        return (
          item.id &&
          item.snippet?.title &&
          item.snippet?.channelTitle &&
          item.snippet?.channelId &&
          (item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url)
        );
      })
      .map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description || "",
        thumbnailUrl:
          item.snippet.thumbnails.maxres?.url ||
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        channelThumbnailUrl: channelAvatars.get(item.snippet.channelId),
        duration: formatYoutubeDuration(item.contentDetails?.duration || "PT0S"),
        viewCount: item.statistics?.viewCount || "0",
        publishedAt: item.snippet.publishedAt,
        likeCount: item.statistics?.likeCount || "0",
      }));

    const response: VideosResponse = {
      videos,
      nextPageToken: searchData.nextPageToken,
    };

    // On stocke TOUTES les pages (y compris pageToken) dans le cache
    saveCache(response, pageToken);

    return response;
  } catch (error) {
    // Vérifie si c'est un problème de quota
    if (
      error instanceof Error &&
      (error.message.includes("quota") || error.message.includes("403"))
    ) {
      const cachedData = loadCache(pageToken);
      if (cachedData) {
        return cachedData;
      }
    }
    throw error;
  }
}
