import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BiTime, BiShare } from 'react-icons/bi'
import { FiTrendingUp } from 'react-icons/fi'
import { fetchNews } from '../services/newsService'
import { FeaturedPost } from '../types/news'
import '../styles/components/Hero.css'

const SkeletonCard = ({ isMain = false }: { isMain?: boolean }) => (
  <article className={`featured-card skeleton-card ${isMain ? 'skeleton-main' : 'skeleton-secondary'}`}>
    {isMain ? (
      <>
        <div className="skeleton-image" />
        <div className="skeleton-content">
          <div className="skeleton-badges">
            <div className="skeleton-badge" />
            <div className="skeleton-badge" />
          </div>
          <div className="skeleton-title" />
          <div className="skeleton-meta">
            <div className="skeleton-date" />
            <div className="skeleton-time" />
          </div>
        </div>
      </>
    ) : (
      <div className="skeleton-content">
        <div className="skeleton-badges">
          <div className="skeleton-badge small" />
        </div>
        <div className="skeleton-title small" />
        <div className="skeleton-meta">
          <div className="skeleton-date small" />
          <div className="skeleton-time small" />
        </div>
      </div>
    )}
  </article>
)

// Fonction utilitaire pour nettoyer les URLs d'images
const cleanImageUrl = (url: string): string => {
  return url.replace(/\[\/img\]/g, '').replace(/\[img\]/g, '')
}

export const Hero = () => {
  const [readPosts, setReadPosts] = useState<Set<number>>(() => {
    // Récupérer les articles lus depuis le localStorage
    const saved = localStorage.getItem('readPosts')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [displayedPosts, setDisplayedPosts] = useState<FeaturedPost[]>([])
  const [allPosts, setAllPosts] = useState<FeaturedPost[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInitialPosts = async () => {
      try {
        const posts = await fetchNews()
        if (posts.length === 0) {
          setError('Aucun article disponible pour le moment')
        } else {
          setAllPosts(posts)
          setDisplayedPosts(posts.slice(0, 7))
          setHasMore(posts.length > 6)
          setError(null)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des actualités:', error)
        setError('Impossible de charger les actualités')
      } finally {
        setIsInitialLoading(false)
      }
    }
    loadInitialPosts()
  }, [])

  // Sauvegarder les articles lus dans le localStorage
  useEffect(() => {
    localStorage.setItem('readPosts', JSON.stringify(Array.from(readPosts)))
  }, [readPosts])

  const handleShare = (post: FeaturedPost) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      }).catch(console.error)
    } else {
      console.log('Partage:', post.title)
    }
  }

  const markAsRead = (postId: number) => {
    setReadPosts(prev => new Set(prev).add(postId))
  }

  const loadMore = async () => {
    setIsLoadingMore(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const currentLength = displayedPosts.length
    const nextPosts = allPosts.slice(currentLength, currentLength + 3)
    
    setDisplayedPosts(prev => [...prev, ...nextPosts])
    setHasMore(currentLength + 3 < allPosts.length)
    setIsLoadingMore(false)
  }

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-header">
          <h1>
            <span className="gradient-text" data-text="Actualités">Actualités</span>
            <span className="subtitle">Les Dernières Nouvelles de Space Engineers 2</span>
          </h1>
        </div>

        <div className="featured-posts">
          {error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
          ) : isInitialLoading ? (
            <>
              <SkeletonCard isMain={true} />
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </>
          ) : (
            <>
              {displayedPosts.map(post => (
                <Link 
                  to={`/article/${post.id}`}
                  key={post.id}
                  className={`featured-card ${post.trending ? 'trending' : ''} ${readPosts.has(post.id) ? 'read' : ''}`}
                  onClick={() => markAsRead(post.id)}
                  data-excerpt={post.excerpt}
                >
                  <div className="featured-image">
                    <img src={cleanImageUrl(post.image)} alt={post.title} />
                  </div>
                  <div className="featured-content">
                    <div className="category-wrapper">
                      {post.trending && (
                        <span className="trending-badge">
                          <FiTrendingUp /> Trending
                        </span>
                      )}
                      <span className="featured-category">{post.category}</span>
                      {post.tags?.map(tag => (
                        <span key={tag} className="featured-tag">{tag}</span>
                      ))}
                    </div>
                    <h2 className="featured-title" data-text={post.title}>{post.title}</h2>
                    <div className="post-meta">
                      <span className="post-date">{post.date}</span>
                      <span className="read-time">
                        <BiTime />
                        {post.readTime}
                      </span>
                      <button 
                        className="share-btn"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleShare(post)
                        }}
                      >
                        <BiShare />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
              {isLoadingMore && (
                [...Array(3)].map((_, i) => (
                  <SkeletonCard key={`loading-${i}`} />
                ))
              )}
            </>
          )}
        </div>

        {hasMore && (
          <div className="load-more-container">
            <button 
              className={`load-more-button ${isLoadingMore ? 'loading' : ''}`}
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              <span className="btn-text">
                {isLoadingMore ? 'Chargement...' : 'Charger Plus'}
              </span>
              <span className="btn-border" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
} 