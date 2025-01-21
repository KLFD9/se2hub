import { useEffect, useState } from 'react'
import '../styles/components/NewsSection.css'
import { getAllSocialPosts } from '../services/socialMedia'

interface SocialPost {
  id: string
  platform: 'twitter' | 'youtube'
  author: string
  date: string
  content: string
  likes: number
  shares?: number
  views?: number
  link: string
}

export const NewsSection = () => {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const socialPosts = await getAllSocialPosts()
        setPosts(socialPosts)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching social posts:', error)
        setError('Erreur lors de la récupération des posts')
        setLoading(false)
      }
    }

    fetchPosts()

    // Rafraîchir les posts toutes les 5 minutes
    const interval = setInterval(fetchPosts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        )
      case 'youtube':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 3.993L9 16z" />
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor" height="1em" width="1em">
            <path d="M13.0605 8.11073L14.4747 9.52494L7.31466 16.6849L5.90045 15.2707L13.0605 8.11073Z" />
            <path d="M15.2704 5.90076L16.6846 7.31497L9.52467 14.475L8.11046 13.0608L15.2704 5.90076Z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <section className="social-feed-section" id="social">
        <div className="social-container">
          <div className="section-header">
            <h2 className="section-title">En direct des réseaux</h2>
          </div>
          <div className="loading">Chargement des posts...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="social-feed-section" id="social">
        <div className="social-container">
          <div className="section-header">
            <h2 className="section-title">En direct des réseaux</h2>
          </div>
          <div className="error">{error}</div>
        </div>
      </section>
    )
  }

  return (
    <section className="social-feed-section" id="social">
      <div className="social-container">
        <div className="section-header">
          <h2 className="section-title">En direct des réseaux</h2>
        </div>
        
        <div className="social-grid">
          {posts.map(post => (
            <a 
              key={post.id} 
              href={post.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-card"
            >
              <div className="social-card-header">
                <span className="platform-icon">{getPlatformIcon(post.platform)}</span>
                <span className="author">{post.author}</span>
                <span className="date">{post.date}</span>
              </div>
              <div className="social-content">
                <p className="content-text" data-text={post.content}>{post.content}</p>
                <div className="social-stats">
                  <span className="likes">❤️ {post.likes}</span>
                  {post.shares && <span className="shares">🔄 {post.shares}</span>}
                  {post.views && <span className="views">👁️ {post.views}</span>}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
} 