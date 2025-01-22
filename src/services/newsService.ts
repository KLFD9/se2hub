import { FeaturedPost } from '../types/news'

const STEAM_APP_ID = '1133870' // Space Engineers 2
const STEAM_NEWS_URL = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${STEAM_APP_ID}&count=10&maxlength=1000&format=json`
const CORS_PROXY = 'https://corsproxy.io/?'

interface SteamNewsResponse {
  appnews: {
    newsitems: Array<{
      gid: string;
      title: string;
      url: string;
      author: string;
      contents: string;
      feedlabel: string;
      date: number;
      feedname: string;
      feed_type: number;
      appid: number;
    }>;
    count: number;
  };
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

// Cache pour les requêtes
const cache: { [key: string]: CacheData } = {}
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

// Type pour les requêtes en cours
type PendingRequest = Promise<ProxyResponse>
type PendingImageRequest = Promise<string>
const pendingRequests: { [key: string]: PendingRequest | PendingImageRequest } = {}

// Fonction optimisée pour les requêtes avec cache et déduplication
const fetchWithCache = async (url: string): Promise<ProxyResponse> => {
  const now = Date.now()
  const cacheKey = encodeURIComponent(url)
  
  if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_DURATION) {
    return cache[cacheKey].data
  }

  const pendingRequest = pendingRequests[cacheKey] as PendingRequest | undefined
  if (pendingRequest) {
    return pendingRequest
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const request = (async () => {
      try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
          headers: { 
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        if (url === STEAM_NEWS_URL) {
          if (!data.appnews?.newsitems) {
            throw new Error('Structure de réponse Steam invalide')
          }
          const processedData: ProxyResponse = {
            contents: JSON.stringify(data),
            status: {
              url: url,
              content_type: 'application/json',
              http_code: 200
            }
          }
          cache[cacheKey] = {
            data: processedData,
            timestamp: now
          }
          return processedData
        }

        if (!data.contents) {
          throw new Error('Réponse invalide: pas de contenu')
        }

        const processedData: ProxyResponse = {
          contents: data.contents,
          status: data.status
        }

        cache[cacheKey] = {
          data: processedData,
          timestamp: now
        }

        return processedData
      } finally {
        delete pendingRequests[cacheKey]
        clearTimeout(timeoutId)
      }
    })()

    pendingRequests[cacheKey] = request
    return request
  } catch {
    delete pendingRequests[cacheKey]
    clearTimeout(timeoutId)
    throw new Error(`Erreur lors de la récupération des données depuis ${url}`)
  }
}

// Fonction pour extraire l'image featured avec cache et déduplication
const extractFeaturedImage = async (content: string, url: string): Promise<string> => {
  try {
    const steamImageRegex = /\{STEAM_CLAN_IMAGE\}\/[^}"\s]+/g
    const matches = content.match(steamImageRegex)
    if (matches && matches.length > 0) {
      const imagePath = matches[0].replace('{STEAM_CLAN_IMAGE}', 'https://clan.cloudflare.steamstatic.com/images/')
      return imagePath
    }

    const urlRegex = /https?:\/\/[^\s<>"]+?\.(?:jpg|jpeg|gif|png|webp)(?:\?[^\s<>"]*)?/gi
    const urlMatches = Array.from(content.matchAll(urlRegex))
      .map(match => match[0])
      .filter(url => !url.includes('emoticon') && !url.includes('icon'))

    if (urlMatches.length > 0) {
      const imageUrl = urlMatches[0]
      if (imageUrl.includes('clan.cloudflare.steamstatic.com') && !imageUrl.includes('/images/')) {
        const parts = imageUrl.split('clan.cloudflare.steamstatic.com/')
        return `https://clan.cloudflare.steamstatic.com/images/${parts[1]}`
      }
      return imageUrl
    }

    if (url && url.includes('steamcommunity.com')) {
      const steamUrl = url.replace('steamstore-a.akamaihd.net/news/externalpost/', '')
      
      try {
        const articleData = await fetchWithCache(steamUrl)
        if (articleData.contents) {
          const parser = new DOMParser()
          const articleDoc = parser.parseFromString(articleData.contents, 'text/html')

          const ogImage = articleDoc.querySelector('meta[property="og:image"]')?.getAttribute('content')
          if (ogImage) {
            return ogImage
          }

          const imageSelectors = [
            'img.blog_large_image',
            '.blogSectionContent img',
            '.announcement_body img',
            'img.news_image'
          ]

          for (const selector of imageSelectors) {
            const images = articleDoc.querySelectorAll(selector)
            for (const img of Array.from(images)) {
              const src = img.getAttribute('src') || img.getAttribute('data-asyncsrc')
              if (src && !src.includes('emoticon') && !src.includes('icon')) {
                if (src.includes('clan.cloudflare.steamstatic.com') && !src.includes('/images/')) {
                  const parts = src.split('clan.cloudflare.steamstatic.com/')
                  return `https://clan.cloudflare.steamstatic.com/images/${parts[1]}`
                }
                return src
              }
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors de la récupération de l\'article Steam:', error)
      }
    }

    const defaultImages = [
      `https://cdn.akamai.steamstatic.com/steam/apps/${STEAM_APP_ID}/header.jpg`,
      `https://cdn.akamai.steamstatic.com/steam/apps/${STEAM_APP_ID}/ss_c21e6e58ca43d90e477b6f9998f0514dddd6d8cd.1920x1080.jpg`,
      `https://cdn.akamai.steamstatic.com/steam/apps/${STEAM_APP_ID}/ss_32e78b928d7e442b781d73f3338c769c35147c5e.1920x1080.jpg`,
      `https://cdn.akamai.steamstatic.com/steam/apps/${STEAM_APP_ID}/ss_5f58b929c445e4c29c99d6c639745fdb162e42c5.1920x1080.jpg`
    ]
    
    return defaultImages[Math.floor(Math.random() * defaultImages.length)]
  } catch {
    return `https://cdn.akamai.steamstatic.com/steam/apps/${STEAM_APP_ID}/header.jpg`
  }
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export const fetchNews = async (): Promise<FeaturedPost[]> => {
  try {
    console.log('🚀 Récupération des actualités Steam...')
    
    const fetchStartTime = performance.now()
    
    let newsData: ProxyResponse
    try {
      newsData = await fetchWithCache(STEAM_NEWS_URL)
      if (!newsData.contents) {
        throw new Error('Pas de contenu dans la réponse')
      }
    } catch {
      throw new Error('Impossible de récupérer les actualités')
    }

    const steamNews: SteamNewsResponse = JSON.parse(newsData.contents)
    
    if (!steamNews.appnews?.newsitems || steamNews.appnews.newsitems.length === 0) {
      throw new Error('Aucun article disponible')
    }

    const posts = await Promise.all(
      steamNews.appnews.newsitems.map(async (item, index) => {
        const imageUrl = await extractFeaturedImage(item.contents, item.url)

        const image = imageUrl.startsWith('https://clan.cloudflare.steamstatic.com') 
          ? imageUrl 
          : `https://cdn.akamai.steamstatic.com/steam/apps/${STEAM_APP_ID}/header.jpg`

        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = item.contents
        const textContent = tempDiv.textContent || tempDiv.innerText || ''
        const excerpt = textContent.length > 150 
          ? textContent.slice(0, 147) + '...' 
          : textContent

        return {
          id: parseInt(item.gid),
          title: item.title,
          category: item.feedlabel || 'News',
          date: formatDate(item.date),
          readTime: `${Math.max(3, Math.ceil(textContent.length / 1000))} min`,
          excerpt,
          content: item.contents,
          image,
          trending: index < 2,
          tags: ['Space Engineers 2', item.feedname],
          isRead: false
        }
      })
    )
    
    const totalTime = performance.now() - fetchStartTime
    console.log(`✅ ${posts.length} articles récupérés en ${totalTime.toFixed(0)}ms`)
    
    return posts
  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : 'Erreur inconnue')
    throw error
  }
}