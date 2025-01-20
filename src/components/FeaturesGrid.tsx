import '../styles/components/FeaturesGrid.css'

interface Feature {
  id: number
  title: string
  description: string
  icon: string
}

const features: Feature[] = [
  {
    id: 1,
    title: "Construction Avancée",
    description: "Créez des vaisseaux et des stations spatiales avec un nouveau système de construction intuitif et puissant.",
    icon: "🚀"
  },
  {
    id: 2,
    title: "IA Améliorée",
    description: "Des drones et des systèmes automatisés plus intelligents pour vous assister dans vos aventures spatiales.",
    icon: "🤖"
  },
  {
    id: 3,
    title: "Univers Dynamique",
    description: "Explorez un univers vivant avec des événements aléatoires, des missions et des découvertes uniques.",
    icon: "🌌"
  },
  {
    id: 4,
    title: "Physique Réaliste",
    description: "Profitez d'une simulation physique améliorée pour des interactions plus réalistes avec l'environnement.",
    icon: "⚡"
  },
  {
    id: 5,
    title: "Multijoueur Étendu",
    description: "Collaborez ou affrontez-vous dans des batailles épiques avec un système multijoueur optimisé.",
    icon: "👥"
  },
  {
    id: 6,
    title: "Personnalisation Totale",
    description: "Personnalisez chaque aspect de vos créations avec de nouveaux outils et options de customisation.",
    icon: "🎨"
  }
]

export const FeaturesGrid = () => {
  return (
    <section className="features-section" id="features">
      <div className="features-container">
        <h2 className="section-title">Fonctionnalités Principales</h2>
        <p className="section-description">
          Découvrez les innovations majeures qui font de Space Engineers 2 
          une expérience unique dans l'univers des jeux de construction spatiale.
        </p>

        <div className="features-grid">
          {features.map(feature => (
            <div key={feature.id} className="feature-card">
              <div className="feature-icon">
                <span>{feature.icon}</span>
              </div>
              <div className="feature-content">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
              <div className="feature-hover-effect"></div>
            </div>
          ))}
        </div>

        <div className="features-cta">
          <button className="explore-features-btn">
            Explorer Toutes les Fonctionnalités
          </button>
        </div>
      </div>
    </section>
  )
} 