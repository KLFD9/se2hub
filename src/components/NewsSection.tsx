import { useState } from 'react'
import '../styles/components/NewsSection.css'

interface NewsItem {
  id: number
  title: string
  date: string
  category: string
  image: string
  excerpt: string
}

const mockNews: NewsItem[] = [
  {
    id: 1,
    title: "Nouveau Système de Construction Révolutionnaire",
    date: "15 Mars 2024",
    category: "Gameplay",
    image: "/news/construction-system.jpg",
    excerpt: "Découvrez comment le nouveau système de construction va transformer votre expérience de jeu..."
  },
  {
    id: 2,
    title: "Intelligence Artificielle des Drones Améliorée",
    date: "12 Mars 2024",
    category: "Fonctionnalités",
    image: "/news/drone-ai.jpg",
    excerpt: "Les drones sont maintenant plus intelligents que jamais avec notre nouveau système d'IA..."
  },
  {
    id: 3,
    title: "Exploration de Nouvelles Galaxies",
    date: "10 Mars 2024",
    category: "Contenu",
    image: "/news/galaxies.jpg",
    excerpt: "Préparez-vous à explorer des systèmes stellaires générés procéduralement..."
  }
]

export const NewsSection = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const filteredNews = activeCategory === 'all' 
    ? mockNews 
    : mockNews.filter(news => news.category.toLowerCase() === activeCategory.toLowerCase())

  return (
    <section className="news-section" id="news">
      <div className="news-container">
        <h2 className="section-title">Dernières Actualités</h2>
        
        <div className="category-filters">
          <button 
            className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Tout
          </button>
          <button 
            className={`category-btn ${activeCategory === 'gameplay' ? 'active' : ''}`}
            onClick={() => setActiveCategory('gameplay')}
          >
            Gameplay
          </button>
          <button 
            className={`category-btn ${activeCategory === 'fonctionnalités' ? 'active' : ''}`}
            onClick={() => setActiveCategory('fonctionnalités')}
          >
            Fonctionnalités
          </button>
          <button 
            className={`category-btn ${activeCategory === 'contenu' ? 'active' : ''}`}
            onClick={() => setActiveCategory('contenu')}
          >
            Contenu
          </button>
        </div>

        <div className="news-grid">
          {filteredNews.map(news => (
            <article key={news.id} className="news-card">
              <div className="news-image">
                <img src={news.image} alt={news.title} />
                <span className="news-category">{news.category}</span>
              </div>
              <div className="news-content">
                <span className="news-date">{news.date}</span>
                <h3 className="news-title">{news.title}</h3>
                <p className="news-excerpt">{news.excerpt}</p>
                <button className="read-more">Lire la suite</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
} 