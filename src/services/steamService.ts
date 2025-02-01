interface SteamConfig {
  appId: string;
  language?: string;
}

export interface SteamScreenshot {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  author: {
    steamId: string;
    name: string;
    profileUrl: string;
    avatarUrl: string;
  };
  stats: {
    likes: number;
    comments: number;
    views: number;
  };
  date: string;
  tags: string[];
  steamUrl: string;
}

interface ProxyResponse {
  contents: string;
  status?: {
    url: string;
    content_type: string;
    http_code: number;
  };
}

interface CacheData {
  data: ProxyResponse;
  timestamp: number;
}

const CORS_PROXY = 'https://corsproxy.io/?';
const CACHE_DURATION = 5 * 60 * 1000;
type PendingRequest = Promise<ProxyResponse>;
const pendingRequests: { [key: string]: PendingRequest } = {};
const cache: { [key: string]: CacheData } = {};

class SteamService {
  private config: SteamConfig;

  constructor(config: SteamConfig) {
    this.config = {
      language: 'french',
      ...config,
    };
  }

  private async fetchWithCache(url: string, externalSignal?: AbortSignal): Promise<ProxyResponse> {
    const now = Date.now();
    const cacheKey = encodeURIComponent(url);

    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
      return cache[cacheKey].data;
    }

    const pendingRequest = pendingRequests[cacheKey];
    if (pendingRequest) {
      return pendingRequest;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    if (externalSignal) {
      externalSignal.addEventListener('abort', () => {
        controller.abort();
        clearTimeout(timeoutId);
      });
    }

    try {
      const request = (async () => {
        try {
          const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
            headers: {
              'Accept': 'text/html,application/xhtml+xml',
              'Origin': window.location.origin
            },
            signal: externalSignal || controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          const contents = await response.text();
          const data: ProxyResponse = {
            contents,
            status: {
              url,
              content_type: response.headers.get('content-type') || 'text/html',
              http_code: response.status
            }
          };

          cache[cacheKey] = { data, timestamp: now };
          return data;
        } finally {
          delete pendingRequests[cacheKey];
          clearTimeout(timeoutId);
        }
      })();

      pendingRequests[cacheKey] = request;
      return request;
    } catch (error) {
      delete pendingRequests[cacheKey];
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private extractImageUrls(imageElement: HTMLImageElement | null): { thumbnailUrl: string; url: string } {
    const rawUrl = imageElement?.src || '';
    const fullUrl = rawUrl.split('?')[0];
    return {
      thumbnailUrl: rawUrl,
      url: fullUrl
    };
  }

  async getScreenshots(
    params: {
      page?: number;
      sort?: 'popular' | 'newest' | 'trending';
      period?: 'day' | 'week' | 'month' | 'all';
    },
    options?: { signal?: AbortSignal }
  ): Promise<SteamScreenshot[]> {
    const { page = 1, sort = 'popular', period = 'all' } = params;
    
    try {
      const url = `https://steamcommunity.com/app/${this.config.appId}/screenshots/?p=${page}&browsefilter=${sort}&period=${period}`;
      const response = await this.fetchWithCache(url, options?.signal);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.contents, 'text/html');
      const items = doc.querySelectorAll('.apphub_Card');

      return Array.from(items).map((item, index) => {
        const getElement = (selector: string) => item.querySelector(selector);
        const getText = (selector: string) => getElement(selector)?.textContent?.trim() || '';

        // Extraction des URLs
        const imageElement = getElement('.apphub_CardContentPreviewImage') as HTMLImageElement;
        const { thumbnailUrl, url } = this.extractImageUrls(imageElement);

        // Extraction améliorée de l'auteur
        const authorContainer = getElement('.apphub_CardContentAuthorBlock') as HTMLElement;
        const authorBlock = authorContainer?.querySelector('.apphub_friend_block') as HTMLElement;
        const authorNameElement = authorBlock?.querySelector('.apphub_CardContentAuthorName.offline a:last-child, .apphub_CardContentAuthorName.online a:last-child') as HTMLAnchorElement;
        const authorAvatarElement = authorBlock?.querySelector('.appHubIconHolder img') as HTMLImageElement;
        
        const authorLink = authorNameElement?.href || '';
        const authorName = authorNameElement?.textContent?.trim() || '';
        const authorAvatarUrl = authorAvatarElement?.src || '';

        // Nettoyage et validation des données de l'auteur
        const author = {
          steamId: authorLink.split('/').filter(Boolean).pop() || '',
          name: authorName || 'Anonyme',
          profileUrl: authorLink || '#',
          avatarUrl: authorAvatarUrl || ''
        };

        // Extraction du reste des données
        const title = getText('.apphub_CardContentTitle') || 'Sans titre';
        const description = getText('.apphub_CardTextContent') || '';
        const likesText = getText('.apphub_CardRating');
        const commentsText = getText('.apphub_CardCommentCount');
        const viewsText = getText('.apphub_CardContentViewsAndDateDetails');

        const stats = {
          likes: parseInt(likesText.replace(/[^\d]/g, '')) || 0,
          comments: parseInt(commentsText.replace(/[^\d]/g, '')) || 0,
          views: parseInt(viewsText.replace(/[^\d]/g, '')) || 0
        };

        const tags = Array.from(item.querySelectorAll('.apphub_CardContentMoreLink'))
          .map(tag => tag.textContent?.trim() || '')
          .filter(tag => tag && tag !== "Voir les captures d'écran");

        const dateText = getText('.apphub_CardContentDate');
        const date = dateText || new Date().toISOString();

        return {
          id: item.getAttribute('data-publishedfileid') || `${Date.now()}-${index}`,
          thumbnailUrl,
          url,
          title,
          description,
          author,
          stats,
          date,
          tags,
          steamUrl: imageElement?.closest('a')?.getAttribute('href') || ''
        };
      }).filter(screenshot => screenshot.url);
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      throw new Error(`Failed to load screenshots: ${error.message}`);
    }
  }

  setAppId(appId: string) {
    this.config.appId = appId;
    Object.keys(cache).forEach(key => delete cache[key]);
  }
}

export const steamService = new SteamService({
  appId: '1133870',
});