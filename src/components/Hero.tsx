import { useState } from 'react'
import { BiTime, BiShare } from 'react-icons/bi'
import { FiTrendingUp } from 'react-icons/fi'
import '../styles/components/Hero.css'

interface FeaturedPost {
  id: number
  title: string
  category: string
  date: string
  readTime: string
  excerpt: string
  image: string
  trending?: boolean
  isRead?: boolean
  tags?: string[]
}

const featuredPosts: FeaturedPost[] = [
  {
    id: 1,
    title: "Nouveau Système de Construction: Une Révolution dans l'Ingénierie Spatiale",
    category: "Mise à Jour Majeure",
    date: "15 Mars 2024",
    readTime: "5 min",
    excerpt: "Découvrez comment le nouveau système de construction va transformer votre expérience de jeu...",
    image: "https://2.spaceengineersgame.com/wp-content/uploads/2021/01/1.png",
    trending: true,
    isRead: false,
    tags: ['Construction', 'Mise à jour', 'Gameplay']
  },
  {
    id: 2,
    title: "Guide Complet: Optimisation des Stations Spatiales en 2024",
    category: "Guide",
    date: "14 Mars 2024",
    readTime: "8 min",
    excerpt: "Les meilleures pratiques pour concevoir et gérer des stations spatiales efficaces...",
    image: "https://2.spaceengineersgame.com/wp-content/uploads/2021/01/3.png"
  },
  {
    id: 3,
    title: "Intelligence Artificielle des Drones: Mise à Jour Majeure",
    category: "Fonctionnalités",
    date: "13 Mars 2024",
    readTime: "6 min",
    excerpt: "Les drones sont maintenant plus intelligents que jamais avec le nouveau système d'IA...",
    image: "https://2.spaceengineersgame.com/wp-content/uploads/2021/01/5.png",
    trending: true
  },
  {
    id: 4,
    title: "Les Secrets de la Production de Ressources",
    category: "Tutoriel",
    date: "12 Mars 2024",
    readTime: "10 min",
    excerpt: "Optimisez votre chaîne de production avec ces techniques avancées...",
    image: "https://2.spaceengineersgame.com/wp-content/uploads/2021/01/7.png"
  }
]

export const Hero = () => {
  const [readPosts, setReadPosts] = useState<Set<number>>(new Set())

  const handleShare = (post: FeaturedPost) => {
    // Logique de partage à implémenter
    console.log('Partage:', post.title)
  }

  const markAsRead = (postId: number) => {
    setReadPosts(prev => new Set(prev).add(postId))
  }

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-header">
          <h1>
            <span className="gradient-text">Actualités</span>
            <span className="subtitle">Les Dernières Nouvelles de Space Engineers 2</span>
          </h1>
        </div>

        <div className="featured-posts">
          {featuredPosts.map(post => (
            <article 
              key={post.id} 
              className={`featured-card ${post.trending ? 'trending' : ''} ${readPosts.has(post.id) ? 'read' : 'unread'}`}
              onClick={() => markAsRead(post.id)}
            >
              <div className="featured-image">
                <img src={post.image} alt={post.title} />
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
                    <span key={tag} className="featured-category">{tag}</span>
                  ))}
                </div>
                
                <h2 className="featured-title">{post.title}</h2>
                <p className="featured-excerpt">{post.excerpt}</p>
                
                <div className="post-meta">
                  <div className="read-indicator" />
                  <span className="post-date">{post.date}</span>
                  <span className="read-time">
                    <BiTime />
                    {post.readTime}
                  </span>
                  <button 
                    className="share-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShare(post)
                    }}
                  >
                    <BiShare />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
} 