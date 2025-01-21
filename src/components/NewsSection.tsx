import '../styles/components/NewsSection.css'

interface SocialPost {
  id: number
  platform: 'twitter' | 'instagram' | 'youtube'
  author: string
  date: string
  content: string
  likes: number
  shares?: number
  views?: number
  link: string
}

const mockSocialPosts: SocialPost[] = [
  {
    id: 1,
    platform: 'twitter',
    author: '@EngineerHub',
    date: '15 Mars 2024',
    content: 'Découvrez notre nouvelle mise à jour du système de construction ! #GameDev #Engineering',
    likes: 1200,
    shares: 450,
    link: 'https://twitter.com/engineerhub/status/1'
  },
  {
    id: 2,
    platform: 'instagram',
    author: '@engineerhub.official',
    date: '14 Mars 2024',
    content: '🚀 Les nouveaux designs sont là ! Swipez pour découvrir les dernières innovations.',
    likes: 3500,
    link: 'https://instagram.com/p/1'
  },
  {
    id: 3,
    platform: 'youtube',
    author: 'Engineer Hub Official',
    date: '13 Mars 2024',
    content: 'Comment construire votre première base spatiale - Tutorial complet',
    likes: 5600,
    views: 25000,
    link: 'https://youtube.com/watch?v=1'
  }
]

export const NewsSection = () => {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return '𝕏'
      case 'instagram':
        return '📸'
      case 'youtube':
        return '▶️'
      default:
        return '🔗'
    }
  }

  return (
    <section className="social-feed-section" id="social">
      <div className="social-container">
        <div className="section-header">
          <h2 className="section-title">En direct des résaux</h2>
        </div>
        
        <div className="social-grid">
          {mockSocialPosts.map(post => (
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
                <p className="content-text">{post.content}</p>
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