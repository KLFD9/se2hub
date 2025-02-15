// ArticlePage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'
import DOMPurify from 'dompurify'
import { FeaturedPost } from '../types/news'
import { fetchArticleById } from '../services/newsService'
import '../styles/components/ArticlePage.css'

const MarkdownParser = (content: string): string => {
  if (!content) return ''
  let parsed = content
    .replace(/" class="article-image"[^>]*>/g, '')
    .replace(/{STEAM_CLAN_IMAGE}\/[^}\s]+/g, '')
    .trim()

  const bbCodeReplacements = [
    {
      pattern: /\[table(?:=([^\]]+))?\]([\s\S]*?)\[\/table\]/g,
      replacement: (_: string, attrs: string, content: string) => {
        const tableAttrs = attrs
          ? attrs.split(' ').reduce((acc: Record<string, string>, attr) => {
              const [key, value] = attr.split('=')
              if (key && value) acc[key] = value.replace(/["']/g, '')
              return acc
            }, {})
          : {}

        const tableClass = ['article-table']
        if (tableAttrs.noborder === '1') tableClass.push('no-border')
        if (tableAttrs.equalcells === '1') tableClass.push('equal-cells')

        return `<div class="${tableClass.join(' ')}">${content}</div>`
      }
    },
    {
      pattern: /\[h([1-6])\]([\s\S]*?)\[\/h\1\]/g,
      replacement: (_: string, level: string, content: string) => {
        const processedContent = content.trim()
        return `<h${level} class="article-heading article-h${level}">${processedContent}</h${level}>`
      }
    },
    {
      pattern: /\[previewyoutube=([a-zA-Z0-9_-]+)(?:;.*?)?\]\[\/previewyoutube\]/g,
      replacement: (_: string, videoId: string) => {
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
    {
      pattern: /\[tr\]([\s\S]*?)\[\/tr\]/g,
      replacement: (_: string, content: string) => {
        return `<div class="article-table-row">${content}</div>`
      }
    },
    {
      pattern: /\[td\]([\s\S]*?)\[\/td\]/g,
      replacement: (_: string, content: string) => {
        return `<div class="article-table-cell">${content}</div>`
      }
    },
    {
      pattern: /\[b\](.*?)\[\/b\]/g,
      replacement: (_: string, content: string) =>
        `<strong class="article-bold">${content}</strong>`
    },
    {
      pattern: /\[i\](.*?)\[\/i\]/g,
      replacement: (_: string, content: string) =>
        `<em class="article-italic">${content}</em>`
    },
    {
      pattern: /\[list\](.*?)\[\/list\]/gs,
      replacement: (_: string, content: string) => {
        return `<ul class="article-list">${content.replace(
          /\[\*\]([^\[]*)/g,
          (_: string, item: string) =>
            `<li class="article-list-item">${item.trim()}</li>`
        )}</ul>`
      }
    },
    {
      pattern: /\[url=([^\]]+)\](.*?)\[\/url\]/g,
      replacement: (_: string, url: string, text: string) => {
        return `<a href="${url}" class="article-link" target="_blank" rel="noopener noreferrer">${text}</a>`
      }
    },
    {
      pattern: /\[img\](.*?)\[\/img\]/g,
      replacement: (_: string, url: string) => {
        if (url.includes('steamstatic') || url.includes('clan.cloudflare.steamstatic')) {
          return ''
        }
        return `<img src="${url}" class="article-image" alt="Article image" loading="lazy" />`
      }
    },
    {
      pattern: /\[quote\](.*?)\[\/quote\]/gs,
      replacement: (_: string, content: string) => {
        return `<blockquote class="article-quote">${content}</blockquote>`
      }
    },
    {
      pattern: /\[code\](.*?)\[\/code\]/gs,
      replacement: (_: string, content: string) => {
        return `<pre class="article-code"><code>${content}</code></pre>`
      }
    }
  ]

  bbCodeReplacements.forEach(({ pattern, replacement }) => {
    parsed = parsed.replace(pattern, replacement)
  })

  parsed = parsed.replace(/(?:^|\n|\s)•\s*([^\n]+)/g, (_: string, item: string) => {
    return `\n<li class="article-list-item">${item.trim()}</li>\n`
  })

  parsed = parsed.replace(
    /(<li class="article-list-item">.*?<\/li>\n?)+/gs,
    (match: string) => {
      return `<ul class="article-list">\n${match}</ul>\n\n`
    }
  )

  const embedReplacements = [
    {
      pattern: /https:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
      handler: (videoId: string) => {
        return `<div class="video-container youtube" data-video-id="${videoId}"></div>`
      }
    },
    {
      pattern: /https:\/\/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/g,
      handler: (channel: string) => {
        return `<div class="video-container twitch" data-channel="${channel}"></div>`
      }
    }
  ]

  embedReplacements.forEach(({ pattern, handler }) => {
    parsed = parsed.replace(pattern, (_: string, param: string) => handler(param))
  })

  if (!parsed.includes('<p')) {
    parsed = parsed
      .split(/\n{2,}/)
      .filter((p: string) => p.trim())
      .map((p: string) => {
        if (p.match(/<(h[1-6]|ul|ol|div|img|iframe)[\s>]/)) {
          return p
        }
        return `<p class="article-paragraph">${p.trim()}</p>`
      })
      .join('\n\n')
  }

  const finalHtml = `<div class="article-content-inner">\n${parsed}\n</div>`

  const sanitized = DOMPurify.sanitize(finalHtml, {
    ALLOWED_TAGS: [
      'div',
      'p',
      'a',
      'img',
      'br',
      'span',
      'ul',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'strong',
      'em',
      'ol',
      'iframe',
      'blockquote',
      'pre',
      'code',
      'table',
      'tr',
      'td'
    ],
    ALLOWED_ATTR: [
      'class',
      'src',
      'alt',
      'href',
      'target',
      'rel',
      'loading',
      'data-video-id',
      'data-channel',
      'style',
      'width',
      'height'
    ],
    ADD_TAGS: ['table', 'tr', 'td'],
    ADD_ATTR: ['style']
  })

  return sanitized
}

export const ArticlePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState<FeaturedPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const handleEmbeds = () => {
      // YouTube
      document.querySelectorAll('.video-container.youtube').forEach((container) => {
        const videoId = container.getAttribute('data-video-id')
        if (videoId) {
          const iframe = document.createElement('iframe')
          iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`
          iframe.title = 'YouTube video player'
          iframe.frameBorder = '0'
          iframe.allow =
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          iframe.allowFullscreen = true
          container.innerHTML = ''
          container.appendChild(iframe)
        }
      })

      // Twitch
      document.querySelectorAll('.video-container.twitch').forEach((container) => {
        const channel = container.getAttribute('data-channel')
        if (channel) {
          const iframe = document.createElement('iframe')
          iframe.src = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=false`
          iframe.title = 'Twitch stream player'
          iframe.frameBorder = '0'
          iframe.allowFullscreen = true
          container.innerHTML = ''
          container.appendChild(iframe)
        }
      })
    }

    if (!isLoading && article) {
      handleEmbeds()
    }
  }, [isLoading, article])

  if (isLoading) {
    return (
      <div className="article-page">
        <div className="article-container">
          {/* Skeleton Loader */}
          <div className="skeleton" style={{ padding: '1rem' }}>
            {/* Bouton retour */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '2rem'
              }}
            >
              <div
                className="skeleton"
                style={{ width: '24px', height: '24px', borderRadius: '50%' }}
              />
              <div
                className="skeleton skeleton-text"
                style={{ width: '80px', height: '1rem' }}
              />
            </div>
            {/* En-tête */}
            <div style={{ marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div
                  className="skeleton skeleton-meta"
                  style={{ width: '60px', height: '1rem' }}
                />
                <div
                  className="skeleton skeleton-meta"
                  style={{ width: '60px', height: '1rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div
                    className="skeleton"
                    style={{ width: '16px', height: '16px', borderRadius: '50%' }}
                  />
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: '50px', height: '1rem' }}
                  />
                </div>
              </div>
              <div className="skeleton skeleton-title" style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <div
                  className="skeleton skeleton-tag"
                  style={{ width: '40px', height: '1rem' }}
                />
                <div
                  className="skeleton skeleton-tag"
                  style={{ width: '40px', height: '1rem' }}
                />
                <div
                  className="skeleton skeleton-tag"
                  style={{ width: '40px', height: '1rem' }}
                />
              </div>
            </div>
            {/* Image héro */}
            <div className="skeleton skeleton-hero" />
            {/* Contenu */}
            <div style={{ display: 'flex', marginTop: '2rem' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  marginRight: '1rem'
                }}
              >
                <div
                  className="skeleton"
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />
                <div
                  className="skeleton"
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />
                <div
                  className="skeleton"
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ marginBottom: '1rem' }} />
                <div className="skeleton skeleton-text" style={{ marginBottom: '1rem' }} />
                <div className="skeleton skeleton-text" style={{ marginBottom: '1rem' }} />
                <div
                  className="skeleton skeleton-text"
                  style={{ width: '80%', marginBottom: '1rem' }}
                />
              </div>
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
              {article.tags.map((tag) => (
                <span key={tag} className="article-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="article-hero-image">
          <img src={article.image} alt={article.title} />
        </div>

        <div className="article-content">
          <div className="article-share-sidebar"></div>

          <div
            className="article-text"
            dangerouslySetInnerHTML={{ __html: MarkdownParser(article.content) }}
          />
        </div>
      </div>
    </article>
  )
}
