// ArticlePage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Clock
} from 'lucide-react'
import DOMPurify from 'dompurify'
import { FeaturedPost } from '../types/news'
import { fetchArticleById } from '../services/newsService'
import '../styles/components/ArticlePage.css'

const YouTubeEmbed = ({ videoId }: { videoId: string }) => (
  <div className="video-container youtube">
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
)

const TwitchEmbed = ({ channel }: { channel: string }) => (
  <div className="video-container twitch">
    <iframe
      src={`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=false`}
      title="Twitch stream player"
      frameBorder="0"
      allowFullScreen
    />
  </div>
)

// Types pour le BBCode
interface BBCodeMatch {
  tag: string;
  attributes?: Record<string, string>;
  content: string;
}

// Types pour le parsing
interface ParsedStats {
  paragraphs: number;
  images: number;
  links: number;
  lists: number;
  headings: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
  };
  embeds: {
    youtube: number;
    twitch: number;
  };
}

const parseBBCode = (content: string): BBCodeMatch[] => {
  const matches: BBCodeMatch[] = []
  // Regex améliorée pour capturer les attributs BBCode et le contenu avec des sauts de ligne
  const regex = /\[(\w+)(?:=([^\]]+))?\]([\s\S]*?)\[\/\1\]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      tag: match[1],
      attributes: match[2] ? match[2].split(' ').reduce((acc: Record<string, string>, attr) => {
        const [key, value] = attr.split('=')
        if (key && value) acc[key] = value.replace(/["']/g, '')
        return acc
      }, {}) : {},
      content: match[3]
    })
  }
  return matches
}

const MarkdownParser = (content: string): string => {
  if (!content) return ''
  
  console.group('🔄 Analyse du formatage')
  
  // Analyse initiale du contenu
  const bbCodeMatches = parseBBCode(content)
  const initialAnalysis = {
    length: content.length,
    hasHtml: /<[^>]+>/g.test(content),
    lineBreaks: (content.match(/\n/g) || []).length,
    steamImages: (content.match(/{STEAM_CLAN_IMAGE}\/[^}\s]+/g) || []).length,
    urls: (content.match(/https?:\/\/[^\s<>"]+/g) || []).length,
    bbCode: bbCodeMatches.length,
    bbTags: bbCodeMatches.map(m => m.tag),
    existingTags: Array.from(content.matchAll(/<(\w+)[^>]*>/g)).map(m => m[1])
  }
  console.log('📊 Analyse initiale:', initialAnalysis)

  // Nettoyage initial du contenu
  let parsed = content
    .replace(/" class="article-image"[^>]*>/g, '')
    .trim()

  // Traitement des balises BBCode complexes
  const bbCodeReplacements = [
    // Tables avec attributs
    {
      pattern: /\[table(?:=([^\]]+))?\]([\s\S]*?)\[\/table\]/g,
      replacement: (_: string, attrs: string, content: string) => {
        console.log('📊 Traitement table avec attributs:', attrs)
        const tableAttrs = attrs ? attrs.split(' ').reduce((acc: Record<string, string>, attr) => {
          const [key, value] = attr.split('=')
          if (key && value) acc[key] = value.replace(/["']/g, '')
          return acc
        }, {}) : {}
        
        const tableClass = ['article-table']
        if (tableAttrs.noborder === '1') tableClass.push('no-border')
        if (tableAttrs.equalcells === '1') tableClass.push('equal-cells')
        
        return `<div class="${tableClass.join(' ')}">${content}</div>`
      }
    },
    // Titres avec émojis
    {
      pattern: /\[h([1-6])\]([\s\S]*?)\[\/h\1\]/g,
      replacement: (_: string, level: string, content: string) => {
        console.log(`🔤 Traitement titre h${level}:`, content.trim())
        // Préserver les émojis dans le contenu
        const processedContent = content.trim()
        return `<h${level} class="article-heading article-h${level}">${processedContent}</h${level}>`
      }
    },
    // Vidéos YouTube avec paramètres
    {
      pattern: /\[previewyoutube=([a-zA-Z0-9_-]+)(?:;.*?)?\]\[\/previewyoutube\]/g,
      replacement: (_: string, videoId: string) => {
        console.log('🎥 Traitement vidéo YouTube:', videoId)
        return `<div class="video-container youtube">
          <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>`
      }
    },
    // Lignes de table
    {
      pattern: /\[tr\]([\s\S]*?)\[\/tr\]/g,
      replacement: (_: string, content: string) => {
        console.log('📑 Traitement ligne de table')
        return `<div class="article-table-row">${content}</div>`
      }
    },
    // Cellules de table
    {
      pattern: /\[td\]([\s\S]*?)\[\/td\]/g,
      replacement: (_: string, content: string) => {
        console.log('📍 Traitement cellule de table')
        return `<div class="article-table-cell">${content}</div>`
      }
    },
    // Texte en gras
    {
      pattern: /\[b\](.*?)\[\/b\]/g,
      replacement: (_: string, content: string) => `<strong class="article-bold">${content}</strong>`
    },
    // Texte en italique
    {
      pattern: /\[i\](.*?)\[\/i\]/g,
      replacement: (_: string, content: string) => `<em class="article-italic">${content}</em>`
    },
    // Listes
    {
      pattern: /\[list\](.*?)\[\/list\]/gs,
      replacement: (_: string, content: string) => {
        return `<ul class="article-list">${content.replace(/\[\*\]([^\[]*)/g, 
          (_: string, item: string) => `<li class="article-list-item">${item.trim()}</li>`
        )}</ul>`
      }
    },
    // URLs
    {
      pattern: /\[url=([^\]]+)\](.*?)\[\/url\]/g,
      replacement: (_: string, url: string, text: string) => {
        return `<a href="${url}" class="article-link" target="_blank" rel="noopener noreferrer">${text}</a>`
      }
    },
    // Images
    {
      pattern: /\[img\](.*?)\[\/img\]/g,
      replacement: (_: string, url: string) => {
        return `<img src="${url}" class="article-image" alt="Article image" loading="lazy" />`
      }
    },
    // Citations
    {
      pattern: /\[quote\](.*?)\[\/quote\]/gs,
      replacement: (_: string, content: string) => {
        return `<blockquote class="article-quote">${content}</blockquote>`
      }
    },
    // Code
    {
      pattern: /\[code\](.*?)\[\/code\]/gs,
      replacement: (_: string, content: string) => {
        return `<pre class="article-code"><code>${content}</code></pre>`
      }
    }
  ]

  // Application des remplacements BBCode
  bbCodeReplacements.forEach(({ pattern, replacement }) => {
    parsed = parsed.replace(pattern, replacement)
  })

  // Stockage des images déjà traitées pour éviter les doublons
  const processedImages = new Set<string>()

  // Traitement des images Steam avec détection des doublons
  parsed = parsed.replace(/{STEAM_CLAN_IMAGE}\/([^}\s]+)/g, (_: string, path: string) => {
    console.log('🖼️ Traitement image Steam:', path)
    if (processedImages.has(path)) {
      console.log('⚠️ Image dupliquée détectée:', path)
      return '' // Ne pas afficher l'image dupliquée
    }
    processedImages.add(path)
    const imageUrl = `https://clan.cloudflare.steamstatic.com/images/${path}`
    return `<img src="${imageUrl}" class="article-image" alt="Steam Community Image" loading="lazy" />`
  })

  // Traitement des listes avec puces
  console.log('🔍 Recherche des listes avec puces...')
  const bulletPoints = parsed.match(/(?:^|\n|\s)•\s*([^\n]+)/g) || []
  console.log(`📝 Nombre d'éléments de liste trouvés: ${bulletPoints.length}`)

  // Conversion des puces en éléments de liste
  parsed = parsed.replace(/(?:^|\n|\s)•\s*([^\n]+)/g, (_: string, item: string) => {
    console.log('➡️ Traitement élément de liste:', item.trim())
    return `\n<li class="article-list-item">${item.trim()}</li>\n`
  })

  // Regrouper les éléments de liste consécutifs
  parsed = parsed.replace(/(<li class="article-list-item">.*?<\/li>\n?)+/gs, 
    (match: string) => {
      console.log('📑 Regroupement d\'éléments de liste')
      return `<ul class="article-list">\n${match}</ul>\n\n`
    }
  )

  // Traitement des liens spéciaux
  const embedReplacements = [
    {
      pattern: /https:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
      handler: (videoId: string) => {
        console.log('🎥 Intégration YouTube:', videoId)
        return `<div class="video-container youtube" data-video-id="${videoId}"></div>`
      }
    },
    {
      pattern: /https:\/\/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/g,
      handler: (channel: string) => {
        console.log('📺 Intégration Twitch:', channel)
        return `<div class="video-container twitch" data-channel="${channel}"></div>`
      }
    }
  ]

  embedReplacements.forEach(({ pattern, handler }) => {
    parsed = parsed.replace(pattern, (_: string, param: string) => handler(param))
  })

  // Structuration en paragraphes
  if (!parsed.includes('<p')) {
    parsed = parsed
      .split(/\n{2,}/)
      .filter((p: string) => p.trim())
      .map((p: string) => {
        // Ne pas envelopper les éléments déjà structurés
        if (p.match(/<(h[1-6]|ul|ol|div|img|iframe)[\s>]/)) {
          return p
        }
        return `<p class="article-paragraph">${p.trim()}</p>`
      })
      .join('\n\n')
  }

  // Analyse finale
  const stats: ParsedStats = {
    paragraphs: (parsed.match(/<p[^>]*>/g) || []).length,
    headings: {
      h1: (parsed.match(/<h1/g) || []).length,
      h2: (parsed.match(/<h2/g) || []).length,
      h3: (parsed.match(/<h3/g) || []).length,
      h4: (parsed.match(/<h4/g) || []).length
    },
    images: (parsed.match(/<img[^>]*>/g) || []).length,
    links: (parsed.match(/<a[^>]*>/g) || []).length,
    lists: (parsed.match(/<ul[^>]*>/g) || []).length,
    embeds: {
      youtube: (parsed.match(/youtube" data-video-id/g) || []).length,
      twitch: (parsed.match(/twitch" data-channel/g) || []).length
    }
  }
  console.log('📊 Analyse finale:', stats)

  // Envelopper dans le conteneur principal
  const finalHtml = `<div class="article-content-inner">\n${parsed}\n</div>`

  // Mise à jour de la sanitisation pour inclure les nouvelles balises
  const sanitized = DOMPurify.sanitize(finalHtml, {
    ALLOWED_TAGS: [
      'div', 'p', 'a', 'img', 'br', 'span', 'ul', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'ol', 'iframe', 'blockquote',
      'pre', 'code', 'table', 'tr', 'td'
    ],
    ALLOWED_ATTR: [
      'class', 'src', 'alt', 'href', 'target', 'rel',
      'loading', 'data-video-id', 'data-channel',
      'style', 'width', 'height'
    ],
    ADD_TAGS: ['table', 'tr', 'td'],
    ADD_ATTR: ['style']
  })

  console.log('✨ Taille finale après sanitization:', sanitized.length)
  console.groupEnd()

  return sanitized
}

export const ArticlePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState<FeaturedPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCopied, setShowCopied] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return
      
      try {
        setIsLoading(true)
        const articleData = await fetchArticleById(id)
        setArticle(articleData)
        setError(null)
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'article:', error)
        setError('Article non trouvé ou erreur lors du chargement')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [id])

  useEffect(() => {
    // Gérer les embeds après le rendu du contenu
    const handleEmbeds = () => {
      // YouTube embeds
      document.querySelectorAll('.video-container.youtube').forEach(container => {
        const videoId = container.getAttribute('data-video-id')
        if (videoId) {
          const iframe = document.createElement('iframe')
          iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`
          iframe.title = "YouTube video player"
          iframe.frameBorder = "0"
          iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          iframe.allowFullscreen = true
          
          // Vider le conteneur et ajouter l'iframe
          container.innerHTML = ''
          container.appendChild(iframe)
        }
      })

      // Twitch embeds
      document.querySelectorAll('.video-container.twitch').forEach(container => {
        const channel = container.getAttribute('data-channel')
        if (channel) {
          const iframe = document.createElement('iframe')
          iframe.src = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=false`
          iframe.title = "Twitch stream player"
          iframe.frameBorder = "0"
          iframe.allowFullscreen = true
          
          // Vider le conteneur et ajouter l'iframe
          container.innerHTML = ''
          container.appendChild(iframe)
        }
      })
    }

    if (!isLoading && article) {
      handleEmbeds()
    }
  }, [isLoading, article])

  const handleShare = async (platform?: string) => {
    if (!article) return

    const shareUrl = window.location.href
    const shareText = `${article.title} - Space Engineers 2`

    try {
      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank'
          )
          break
        case 'discord':
          window.open(
            `https://discord.com/channels/@me?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
            '_blank'
          )
          break
        case 'copy':
          await navigator.clipboard.writeText(shareUrl)
          setShowCopied(true)
          setTimeout(() => setShowCopied(false), 2000)
          break
        default:
          if (navigator.share) {
            await navigator.share({
              title: article.title,
              text: article.excerpt,
              url: shareUrl,
            })
          }
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="article-page">
        <div className="article-container">
          <div className="article-page-skeleton">
            <div className="article-header-skeleton">
              <div className="title-skeleton" />
              <div className="meta-skeleton" />
            </div>
            <div className="content-skeleton">
              <div className="image-skeleton" />
              <div className="text-skeleton" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="article-page">
        <div className="article-container">
          <div className="article-not-found">
            <h2>{error || 'Article non trouvé'}</h2>
            <button onClick={() => navigate('/')}>Retour à l'accueil</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <article className="article-page">
      <div className="article-container">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
        >
          <ArrowLeft />
          <span>Retour</span>
        </button>

        <header className="article-header">
          <div className="article-meta">
            <span className="article-category">{article.category}</span>
            <span className="article-date">{article.date}</span>
            <span className="article-read-time">
              <Clock />
              {article.readTime}
            </span>
          </div>

          <h1 className="article-title">{article.title}</h1>

          {article.tags && (
            <div className="article-tags">
              {article.tags.map(tag => (
                <span key={tag} className="article-tag">#{tag}</span>
              ))}
            </div>
          )}
        </header>

        <div className="article-hero-image">
          <img src={article.image} alt={article.title} />
        </div>

        <div className="article-content">
          <div className="article-share-sidebar">
          </div>

          <div 
            className="article-text"
            dangerouslySetInnerHTML={{ __html: MarkdownParser(article.content) }}
          />
        </div>
      </div>
    </article>
  )
} 
