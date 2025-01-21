import { useState } from 'react'
import '../styles/components/FeaturesGrid.css'
import { 
  HiOutlineViewGrid, 
  HiOutlineViewList,
  HiOutlineStar,
  HiStar,
  HiOutlinePlusCircle,
  HiCheckCircle,
  HiOutlineDownload,
  HiOutlineTag
} from 'react-icons/hi'
import { 
  HiCommandLine, 
  HiRocketLaunch,
  HiPaintBrush,
  HiBolt,
  HiCube 
} from 'react-icons/hi2'

interface Mod {
  id: number
  title: string
  category: string
  description: string
  imageUrl: string
  downloads: number
  lastUpdate: string
  version: string
}

type ViewType = 'grid' | 'list'
type SortType = 'popular' | 'updated' | 'version'

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Gameplay':
      return <HiCommandLine className="category-icon" />
    case 'Véhicules':
      return <HiRocketLaunch className="category-icon" />
    case 'Graphismes':
      return <HiPaintBrush className="category-icon" />
    case 'Technologie':
      return <HiBolt className="category-icon" />
    default:
      return <HiCube className="category-icon" />
  }
}

const mods: Mod[] = [
  {
    id: 1,
    title: "Advanced Mining System",
    category: "Gameplay",
    description: "Améliorez votre expérience minière avec de nouveaux outils et systèmes d'extraction automatisés.",
    imageUrl: "https://thumb.modcdn.io/mods/6fa2/1611228/thumb_1020x2000/thumb.png",
    downloads: 150000,
    lastUpdate: "2024-03-15",
    version: "1.2.0"
  },
  {
    id: 2,
    title: "Star Wars Ships Pack",
    category: "Véhicules",
    description: "Collection complète de vaisseaux inspirés de l'univers Star Wars.",
    imageUrl: "https://thumb.modcdn.io/mods/8d29/93632/thumb_1020x2000/20200319180027_1.1.jpg",
    downloads: 200000,
    lastUpdate: "2024-03-10",
    version: "2.0.1"
  },
  {
    id: 3,
    title: "Enhanced Graphics Overhaul",
    category: "Graphismes",
    description: "Refonte complète des textures et effets visuels pour une expérience plus immersive.",
    imageUrl: "https://thumb.modcdn.io/mods/0ce2/2899583/thumb_1020x2000/thumb.png",
    downloads: 180000,
    lastUpdate: "2024-03-12",
    version: "1.5.0"
  },
  {
    id: 4,
    title: "Advanced Power Systems",
    category: "Technologie",
    description: "Nouveaux réacteurs et systèmes énergétiques pour des constructions plus efficaces.",
    imageUrl: "https://thumb.modcdn.io/mods/d822/2303796/thumb_1020x2000/thumb.png",
    downloads: 120000,
    lastUpdate: "2024-03-08",
    version: "1.1.2"
  }
]

export const FeaturesGrid = () => {
  const [viewType, setViewType] = useState<ViewType>('grid')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [sortType, setSortType] = useState<SortType>('popular')
  const [favorites, setFavorites] = useState<number[]>([])
  const [subscribed, setSubscribed] = useState<number[]>([])

  const toggleFavorite = (modId: number) => {
    setFavorites(prev => 
      prev.includes(modId) 
        ? prev.filter(id => id !== modId)
        : [...prev, modId]
    )
  }

  const toggleSubscribe = (modId: number) => {
    setSubscribed(prev => 
      prev.includes(modId) 
        ? prev.filter(id => id !== modId)
        : [...prev, modId]
    )
  }

  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const filteredMods = mods
    .filter(mod => selectedCategory === 'Tous' || mod.category === selectedCategory)
    .sort((a, b) => {
      switch (sortType) {
        case 'popular':
          return b.downloads - a.downloads
        case 'updated':
          return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()
        case 'version':
          return b.version.localeCompare(a.version)
        default:
          return 0
      }
    })

  return (
    <section className="mods-section" id="mods">
      <div className="mods-container">
        <div className="mods-header">
          <div className="header-top">
            <h2 className="section-title">Mods Communautaires</h2>
            <div className="view-controls">
              <button 
                className={`view-btn ${viewType === 'grid' ? 'active' : ''}`}
                onClick={() => setViewType('grid')}
                title="Vue grille"
              >
                <HiOutlineViewGrid />
              </button>
              <button 
                className={`view-btn ${viewType === 'list' ? 'active' : ''}`}
                onClick={() => setViewType('list')}
                title="Vue liste"
              >
                <HiOutlineViewList />
              </button>
            </div>
          </div>

          <div className="filter-controls">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {["Tous", "Gameplay", "Véhicules", "Graphismes", "Technologie"].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select 
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="sort-select"
            >
              <option value="popular">Plus populaires</option>
              <option value="updated">Récemment mis à jour</option>
              <option value="version">Version</option>
            </select>
          </div>
        </div>

        <div className={`mods-grid view-${viewType}`}>
          {filteredMods.map(mod => (
            <div key={mod.id} className="mod-card">
              <div className="mod-background" style={{ backgroundImage: `url(${mod.imageUrl})` }}>
                <button 
                  className={`favorite-btn ${favorites.includes(mod.id) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(mod.id)}
                >
                  {favorites.includes(mod.id) ? <HiStar /> : <HiOutlineStar />}
                </button>
                <div className="mod-content">
                  <div className="mod-category">
                    {getCategoryIcon(mod.category)}
                    {mod.category}
                  </div>
                  <div className="mod-info">
                    <h3 className="mod-title">{mod.title}</h3>
                    <p className="mod-description">{mod.description}</p>
                    <div className="mod-meta">
                      <span className="downloads">
                        <HiOutlineDownload />
                        {formatDownloads(mod.downloads)}
                      </span>
                      <span className="version">
                        <HiOutlineTag />
                        v{mod.version}
                      </span>
                      <button 
                        className={`subscribe-btn ${subscribed.includes(mod.id) ? 'active' : ''}`}
                        onClick={() => toggleSubscribe(mod.id)}
                        title={subscribed.includes(mod.id) ? "Se désabonner" : "S'abonner"}
                      >
                        {subscribed.includes(mod.id) ? <HiCheckCircle /> : <HiOutlinePlusCircle />}
                        <span>{subscribed.includes(mod.id) ? 'Abonné' : "S'abonner"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mods-cta">
          <button className="load-more-btn">
            Charger plus de mods
          </button>
        </div>
      </div>
    </section>
  )
} 