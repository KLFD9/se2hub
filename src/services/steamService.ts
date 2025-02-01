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

        // Extraction de l'auteur
        const authorElement = getElement('.apphub_CardContentAuthorName a') as HTMLAnchorElement;
        const authorLink = authorElement?.href || '';
        const authorId = authorLink.split('/').pop() || '';

        return {
          id: item.getAttribute('data-publishedfileid') || `${Date.now()}-${index}`,
          thumbnailUrl,
          url,
          title: getText('.apphub_CardContentTitle') || 'Sans titre',
          description: getText('.apphub_CardTextContent'),
          author: {
            steamId: authorId,
            name: authorElement?.textContent?.trim() || 'Anonyme',
            profileUrl: authorLink
          },
          stats: {
            likes: parseInt(getText('.apphub_CardRating')) || 0,
            comments: parseInt(getText('.apphub_CardCommentCount')) || 0,
            views: parseInt(getText('.apphub_CardContentViewsAndDateDetails')?.replace(/\D/g, '') || '0')
          },
          date: getText('.apphub_CardContentDate') || new Date().toISOString(),
          tags: Array.from(item.querySelectorAll('.apphub_CardContentMoreLink'))
            .map(tag => tag.textContent?.trim() || '')
            .filter(Boolean),
          steamUrl: imageElement?.closest('a')?.getAttribute('href') || ''
        };
      }).filter(screenshot => screenshot.url);
    } catch (error: any) {
      console.error('SteamService Error:', error);
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