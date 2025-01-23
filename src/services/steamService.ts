interface SteamConfig {
  appId: string;
  language?: string;
}

export interface SteamScreenshot {
  id: string;
  url: string;
  title: string;
  author: {
    steamId: string;
    name: string;
  };
  stats: {
    likes: number;
    comments: number;
    views: number;
  };
  date: string;
  tags: string[];
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

// Cache pour les requêtes
const cache: { [key: string]: CacheData } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Type pour les requêtes en cours
type PendingRequest = Promise<ProxyResponse>;
const pendingRequests: { [key: string]: PendingRequest } = {};

class SteamService {
  private config: SteamConfig;

  constructor(config: SteamConfig) {
    this.config = {
      language: 'french',
      ...config,
    };
  }

  private async fetchWithCache(url: string): Promise<ProxyResponse> {
    const now = Date.now();
    const cacheKey = encodeURIComponent(url);

    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
      console.log('📦 Utilisation du cache pour:', url);
      return cache[cacheKey].data;
    }

    const pendingRequest = pendingRequests[cacheKey];
    if (pendingRequest) {
      console.log('⏳ Requête en cours pour:', url);
      return pendingRequest;
    }

    console.log('🌐 Nouvelle requête pour:', url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const request = (async () => {
        try {
          const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
            headers: {
              'Accept': 'text/html,application/xhtml+xml',
              'Origin': window.location.origin
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const contents = await response.text();
          console.log('📄 Contenu reçu, taille:', contents.length, 'caractères');

          const data: ProxyResponse = {
            contents,
            status: {
              url,
              content_type: response.headers.get('content-type') || 'text/html',
              http_code: response.status
            }
          };

          cache[cacheKey] = {
            data,
            timestamp: now
          };

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

  private extractImageUrl(imageElement: HTMLImageElement | null, fallbackSrc: string | null = null): string {
    const url = imageElement?.src || fallbackSrc || '';
    if (!url) {
      console.log('⚠️ Pas d\'URL d\'image trouvée');
      return '';
    }
    
    console.log('🖼️ URL d\'image trouvée:', url);

    // Convertir les miniatures en images haute résolution
    if (url.includes('steamuserimages-a.akamaihd.net')) {
      const newUrl = url.replace(/\?t=\d+$/, '')  // Supprimer le timestamp
                       .replace(/\.resizedimage/, '') // Supprimer le suffixe de redimensionnement
                       .replace(/(\d+x\d+)/, '1920x1080'); // Remplacer la taille
      console.log('🔄 URL convertie en haute résolution:', newUrl);
      return newUrl;
    }
    return url;
  }

  async getScreenshots(params: {
    page?: number;
    sort?: 'popular' | 'newest' | 'trending';
    period?: 'day' | 'week' | 'month' | 'all';
  }): Promise<SteamScreenshot[]> {
    const { page = 1, sort = 'popular', period = 'all' } = params;
    
    try {
      console.log('🚀 Récupération des captures d\'écran Steam...');
      console.log('📋 Paramètres:', { page, sort, period });
      const fetchStartTime = performance.now();

      const url = `https://steamcommunity.com/app/${this.config.appId}/screenshots/?p=${page}&browsefilter=${sort}&period=${period}`;
      const response = await this.fetchWithCache(url);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.contents, 'text/html');
      
      // Debug: Vérifier la structure du document
      console.log('🔍 Structure du document:', {
        title: doc.title,
        body: doc.body ? 'présent' : 'absent',
        head: doc.head ? 'présent' : 'absent'
      });

      // Log d'un extrait du HTML pour debug
      console.log('📝 Extrait du HTML:', response.contents.substring(0, 1000));

      const screenshots: SteamScreenshot[] = [];
      
      // Essayer différents sélecteurs pour trouver les conteneurs d'images
      const items = doc.querySelectorAll([
        '.screenshot_holder',
        '.workshopItem',
        '.ugc',
        '.imageWallRow',
        '.profile_media_item',
        '.screenshot_list_item'
      ].join(', '));

      console.log(`📑 Nombre d'éléments trouvés:`, items.length);

      items.forEach((item, index) => {
        console.log(`\n🖼️ Traitement de l'image ${index + 1}/${items.length}`);
        console.log('🔍 Classes de l\'élément:', item.className);

        const id = item.getAttribute('data-publishedfileid') || 
                  item.id || 
                  item.getAttribute('data-ugcid') || 
                  `${Date.now()}-${index}`;

        // Essayer différents sélecteurs pour l'image
        const imageElement = item.querySelector([
          '.workshopItemPreviewImage',
          '.screenshot_holder img',
          '.ugcScreenshotImage',
          '.screenshotHandle img',
          'img[src*="steamusercontent"]',
          'img[src*="steamcommunity"]',
          'img'
        ].join(', ')) as HTMLImageElement;

        // Chercher aussi les images en background-image
        const computedStyle = window.getComputedStyle(item);
        const backgroundImage = computedStyle.backgroundImage.replace(/^url\(['"](.+)['"]\)$/, '$1');

        const titleElement = item.querySelector([
          '.workshopItemTitle',
          '.title',
          '.screenshotTitle',
          '.ugcTitle'
        ].join(', '));

        const authorElement = item.querySelector([
          '.workshopItemAuthorName a',
          '.author',
          '.screenshotAuthorName',
          '.ugcAuthorName'
        ].join(', '));

        const statsElement = item.querySelector([
          '.workshopItemStats',
          '.stats',
          '.screenshotStats',
          '.ugcStats'
        ].join(', '));

        const dateElement = item.querySelector([
          '.workshopItemDate',
          '.date',
          '.screenshotDate',
          '.ugcDate'
        ].join(', '));

        console.log('🔍 Éléments trouvés:', {
          image: !!imageElement,
          backgroundImage: !!backgroundImage,
          title: !!titleElement,
          author: !!authorElement,
          stats: !!statsElement,
          date: !!dateElement
        });

        const url = this.extractImageUrl(imageElement, backgroundImage);
        const title = titleElement?.textContent?.trim() || 'Sans titre';
        const authorName = authorElement?.textContent?.trim() || 'Anonyme';
        const authorId = authorElement?.getAttribute('href')?.split('/').pop() || '';
        
        // Parse stats
        const statsText = statsElement?.textContent || '';
        console.log('📊 Stats brutes:', statsText);

        const likesMatch = statsText.match(/(\d+)\s+(?:favoris|likes?|votes?)/i);
        const commentsMatch = statsText.match(/(\d+)\s+(?:commentaires?|comments?)/i);
        const viewsMatch = statsText.match(/(\d+)\s+(?:vues?|views?|visites?)/i);

        const screenshot: SteamScreenshot = {
          id,
          url,
          title,
          author: {
            steamId: authorId,
            name: authorName,
          },
          stats: {
            likes: likesMatch ? parseInt(likesMatch[1]) : 0,
            comments: commentsMatch ? parseInt(commentsMatch[1]) : 0,
            views: viewsMatch ? parseInt(viewsMatch[1]) : 0,
          },
          date: dateElement?.textContent?.trim() || new Date().toISOString(),
          tags: Array.from(item.querySelectorAll([
            '.workshopItemTag',
            '.tag',
            '.screenshotTag',
            '.ugcTag'
          ].join(', ')))
            .map(tag => tag.textContent?.trim() || '')
            .filter(Boolean),
        };

        console.log('📸 Screenshot traité:', {
          title: screenshot.title,
          url: screenshot.url.substring(0, 50) + '...',
          stats: screenshot.stats
        });

        if (url) {
          screenshots.push(screenshot);
        }
      });

      const totalTime = performance.now() - fetchStartTime;
      console.log(`✅ ${screenshots.length} captures d'écran récupérées en ${totalTime.toFixed(0)}ms`);

      return screenshots;
    } catch (error) {
      console.error('❌ Erreur:', error instanceof Error ? error.message : 'Erreur inconnue');
      throw error;
    }
  }

  setAppId(appId: string) {
    this.config.appId = appId;
    Object.keys(cache).forEach(key => delete cache[key]); // Clear cache when changing game
  }
}

// Créer une instance par défaut avec l'ID de Space Engineers
export const steamService = new SteamService({
  appId: '244850', // ID de Space Engineers
}); 