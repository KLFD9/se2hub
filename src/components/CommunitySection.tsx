import '../styles/components/CommunitySection.css'

interface SocialStat {
  id: number
  label: string
  value: string
  icon: string
}

const socialStats: SocialStat[] = [
  {
    id: 1,
    label: "Joueurs Actifs",
    value: "500K+",
    icon: "👥"
  },
  {
    id: 2,
    label: "Créations Partagées",
    value: "1M+",
    icon: "🚀"
  },
  {
    id: 3,
    label: "Communautés",
    value: "10K+",
    icon: "🌍"
  }
]

export const CommunitySection = () => {
  return (
    <section className="community-section" id="community">
      <div className="community-container">
        <div className="community-content">
          <h2 className="section-title">Rejoignez la Communauté</h2>
          <p className="section-description">
            Faites partie d'une communauté passionnée d'ingénieurs spatiaux. 
            Partagez vos créations, collaborez sur des projets et explorez 
            l'univers ensemble.
          </p>

          <div className="social-stats">
            {socialStats.map(stat => (
              <div key={stat.id} className="stat-card">
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="community-features">
            <div className="community-feature">
              <h3>Workshop Créatif</h3>
              <p>
                Partagez vos vaisseaux, stations et mods avec la communauté. 
                Découvrez des milliers de créations inspirantes.
              </p>
            </div>
            <div className="community-feature">
              <h3>Événements Communautaires</h3>
              <p>
                Participez à des défis de construction, des courses spatiales 
                et des événements spéciaux organisés régulièrement.
              </p>
            </div>
          </div>

          <div className="community-cta">
            <button className="join-discord-btn">
              <span className="discord-icon">📱</span>
              Rejoindre le Discord
            </button>
            <button className="join-forum-btn">
              Accéder au Forum
            </button>
          </div>
        </div>

        <div className="community-image">
          <div className="image-container">
            <div className="floating-card card-1">
              <span className="emoji">🛠️</span>
              <span className="text">Nouveau Mod Publié</span>
            </div>
            <div className="floating-card card-2">
              <span className="emoji">🏆</span>
              <span className="text">Défi Hebdomadaire</span>
            </div>
            <div className="floating-card card-3">
              <span className="emoji">📢</span>
              <span className="text">Événement Live</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 