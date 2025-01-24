interface SteamConfig {
  appId: string;
  language?: string;
}

export interface SteamScreenshot {
  id: string;
  url: string;
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

      const screenshots: SteamScreenshot[] = [];
      
      // Sélectionner les conteneurs de captures d'écran
      const items = doc.querySelectorAll('.apphub_Card');
      console.log(`📑 Nombre d'éléments trouvés:`, items.length);

      items.forEach((item, index) => {
        console.log(`\n🖼️ Traitement de l'image ${index + 1}/${items.length}`);

        // Fonction utilitaire pour extraire le texte avec XPath
        const getXPathText = (xpath: string): string => {
          const result = document.evaluate(
            xpath,
            item,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          );
          return result.singleNodeValue?.textContent?.trim() || '';
        };

        // Extraire l'ID
        const id = item.getAttribute('data-publishedfileid') || `${Date.now()}-${index}`;

        // Extraire la date (plusieurs méthodes)
        let date = new Date().toISOString();
        
        // 1. Essayer d'abord l'attribut data-timestamp
        const timestampXPath = ".//div[contains(@class, 'apphub_CardContentAuthorBlock')]//span[contains(@class, 'timeago')]/@data-timestamp";
        const timestamp = getXPathText(timestampXPath);
        
        if (timestamp) {
          date = new Date(parseInt(timestamp) * 1000).toISOString();
          console.log('📅 Date trouvée via timestamp:', {
            timestamp,
            date: new Date(date).toLocaleString('fr-FR')
          });
        } else {
          // 2. Essayer de trouver la date dans le texte
          const dateXPath = ".//div[contains(@class, 'apphub_CardContentAuthorBlock')]//span[contains(@class, 'timeago')]";
          const dateText = getXPathText(dateXPath);
          console.log('📅 Texte de date trouvé:', dateText);
          
          if (dateText) {
            try {
              const parsedDate = new Date(dateText);
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate.toISOString();
              }
            } catch (error) {
              console.warn('⚠️ Erreur parsing date:', error);
            }
          }
        }

        // Extraire l'auteur (plusieurs méthodes)
        let authorName = '';
        let authorLink = '';
        
        // 1. Essayer le lien direct de l'auteur
        const authorXPath = ".//div[contains(@class, 'apphub_CardContentAuthorName')]//a[contains(@href, '/id/') or contains(@href, '/profiles/')]";
        const authorElement = document.evaluate(
          authorXPath,
          item,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue as HTMLAnchorElement;

        if (authorElement) {
          authorLink = authorElement.href;
          authorName = authorElement.textContent?.trim() || '';
          console.log('👤 Auteur trouvé via lien direct:', { authorName, authorLink });
        }

        // 2. Si pas de nom, essayer d'extraire depuis le conteneur parent
        if (!authorName) {
          const authorContainerXPath = ".//div[contains(@class, 'apphub_CardContentAuthorName')]";
          authorName = getXPathText(authorContainerXPath);
          console.log('👤 Auteur trouvé via conteneur:', authorName);
        }

        // 3. Si toujours pas de nom, extraire de l'URL
        if (!authorName && authorLink) {
          const matches = authorLink.match(/\/(?:id|profiles)\/([^/]+)/);
          if (matches) {
            authorName = decodeURIComponent(matches[1]);
            console.log('👤 Auteur extrait de l\'URL:', authorName);
          }
        }

        const finalAuthorName = authorName || 'Anonyme';
        const authorId = authorLink.split('/').pop() || '';

        // Extraire les vues (plusieurs méthodes)
        let views = 0;
        
        // 1. Essayer le conteneur de stats spécifique
        const viewsXPath = ".//div[contains(@class, 'apphub_CardContentViewsAndDateDetails')]//text()";
        const statsText = getXPathText(viewsXPath);
        console.log('📊 Texte stats brut:', statsText);

        if (statsText) {
          // Essayer plusieurs patterns
          const patterns = [
            /(\d+(?:,\d+)*)\s*views?/i,
            /(\d+(?:,\d+)*)\s*vues?/i,
            /vu\s*(\d+(?:,\d+)*)\s*fois/i,
            /(\d+(?:,\d+)*)\s*times?/i,
            /(\d+(?:,\d+)*)\s*visualizações/i
          ];

          for (const pattern of patterns) {
            const match = statsText.match(pattern);
            if (match) {
              views = parseInt(match[1].replace(/[,.]/g, ''));
              console.log('📊 Vues trouvées via pattern:', { pattern: pattern.toString(), views });
              break;
            }
          }
        }

        // 2. Si pas de vues, essayer de trouver un élément spécifique
        if (!views) {
          const viewCountXPath = ".//span[contains(@class, 'viewCount')]//text()";
          const viewCountText = getXPathText(viewCountXPath);
          if (viewCountText) {
            const num = parseInt(viewCountText.replace(/[^0-9]/g, ''));
            if (!isNaN(num)) {
              views = num;
              console.log('📊 Vues trouvées via élément spécifique:', views);
            }
          }
        }

        // 3. Essayer d'extraire les vues depuis le texte complet
        if (!views) {
          const fullTextXPath = ".//div[contains(@class, 'apphub_CardContentMain')]//text()";
          const fullText = getXPathText(fullTextXPath);
          console.log('📊 Texte complet:', fullText);
          
          const viewMatch = fullText.match(/(\d+(?:,\d+)*)\s*(?:views?|vues?|fois)/i);
          if (viewMatch) {
            views = parseInt(viewMatch[1].replace(/[,.]/g, ''));
            console.log('📊 Vues trouvées dans le texte complet:', views);
          }
        }

        // Extraire l'URL de l'image
        const imageElement = item.querySelector('.apphub_CardContentPreviewImage') as HTMLImageElement;
        const url = this.extractImageUrl(imageElement);
        
        // Extraire le titre et la description
        const titleElement = item.querySelector('.apphub_CardContentTitle');
        const descriptionElement = item.querySelector('.apphub_CardTextContent');
        let title = titleElement?.textContent?.trim() || '';
        const description = descriptionElement?.textContent?.trim() || '';

        if (!title) {
          if (description) {
            title = description.length > 50 ? 
              description.substring(0, 47) + '...' : 
              description;
          } else {
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString('fr-FR', { 
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            title = `Création du ${formattedDate}`;
          }
        }

        // Extraire l'URL Steam de la capture d'écran
        const screenshotLink = item.querySelector('.apphub_CardContentPreviewImage')?.closest('a')?.getAttribute('href') || '';
        
        // Extraire les votes (likes)
        const votesElement = item.querySelector('.apphub_CardRating');
        const votes = votesElement ? parseInt(votesElement.textContent?.trim() || '0') : 0;
        
        // Extraire les commentaires
        const commentsElement = item.querySelector('.apphub_CardCommentCount');
        const comments = commentsElement ? parseInt(commentsElement.textContent?.trim() || '0') : 0;
        
        // Extraire les tags
        const tags = Array.from(item.querySelectorAll('.apphub_CardContentMoreLink'))
          .map(tag => tag.textContent?.trim() || '')
          .filter(Boolean);

        const screenshot: SteamScreenshot = {
          id,
          url,
          title,
          description,
          author: {
            steamId: authorId,
            name: finalAuthorName,
            profileUrl: authorLink
          },
          stats: {
            likes: votes,
            comments: comments,
            views: views,
          },
          date,
          tags,
          steamUrl: screenshotLink
        };

        console.log('📸 Screenshot traité:', {
          title: screenshot.title,
          author: screenshot.author.name,
          stats: screenshot.stats,
          date: screenshot.date,
          rawHTML: {
            dateSection: getXPathText(".//div[contains(@class, 'apphub_CardContentAuthorBlock')]"),
            authorSection: getXPathText(".//div[contains(@class, 'apphub_CardContentAuthorName')]"),
            statsSection: statsText
          }
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