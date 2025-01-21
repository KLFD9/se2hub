import { useEffect, useRef, useState } from 'react'
import { FiCheck, FiServer, FiShield, FiClock, FiCpu, FiGlobe } from 'react-icons/fi'
import '../styles/components/ServerRentalSection.css'

interface ServerPlan {
  id: number
  name: string
  price: string
  slots: number
  features: {
    text: string
    icon: JSX.Element
  }[]
  recommended?: boolean
}

const serverPlans: ServerPlan[] = [
  {
    id: 1,
    name: "Starter",
    price: "15€/mois",
    slots: 10,
    features: [
      { text: "10 slots joueurs", icon: <FiServer /> },
      { text: "Protection DDoS", icon: <FiShield /> },
      { text: "Sauvegarde automatique", icon: <FiClock /> },
      { text: "Support 24/7", icon: <FiCheck /> }
    ]
  },
  {
    id: 2,
    name: "Pro",
    price: "25€/mois",
    slots: 20,
    recommended: true,
    features: [
      { text: "20 slots joueurs", icon: <FiServer /> },
      { text: "Protection DDoS avancée", icon: <FiShield /> },
      { text: "Sauvegarde automatique", icon: <FiClock /> },
      { text: "Support prioritaire 24/7", icon: <FiCheck /> },
      { text: "Mods préinstallés", icon: <FiCpu /> }
    ]
  },
  {
    id: 3,
    name: "Enterprise",
    price: "45€/mois",
    slots: 40,
    features: [
      { text: "40 slots joueurs", icon: <FiServer /> },
      { text: "Protection DDoS premium", icon: <FiShield /> },
      { text: "Sauvegarde automatique", icon: <FiClock /> },
      { text: "Support VIP 24/7", icon: <FiCheck /> },
      { text: "Mods préinstallés", icon: <FiCpu /> },
      { text: "Configuration personnalisée", icon: <FiGlobe /> },
      { text: "IP dédiée", icon: <FiServer /> }
    ]
  }
]

export const ServerRentalSection = () => {
  const particlesRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (particlesRef.current) {
      observer.observe(particlesRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || !particlesRef.current) return

    let particleCount = 0
    const MAX_PARTICLES = 30

    const createParticle = () => {
      if (!particlesRef.current || particleCount >= MAX_PARTICLES) return

      const particle = document.createElement('div')
      particle.className = 'particle'
      
      // Position aléatoire de départ dans la zone visible
      const rect = particlesRef.current.getBoundingClientRect()
      const startX = Math.random() * rect.width
      const startY = Math.random() * rect.height
      
      // Déplacement plus court pour optimisation
      const moveX = (Math.random() - 0.5) * 200
      const moveY = (Math.random() - 0.5) * 200
      const moveZ = Math.random() * 100 - 50
      
      // Taille et flou réduits
      const size = Math.random() * 2 + 1
      const blur = Math.random() * 2
      
      particle.style.setProperty('--moveX', `${moveX}px`)
      particle.style.setProperty('--moveY', `${moveY}px`)
      particle.style.setProperty('--moveZ', `${moveZ}px`)
      particle.style.setProperty('--size', `${size}px`)
      particle.style.setProperty('--blur', `${blur}px`)
      
      particle.style.left = `${startX}px`
      particle.style.top = `${startY}px`
      
      particlesRef.current.appendChild(particle)
      particleCount++
      
      particle.addEventListener('animationend', () => {
        particle.remove()
        particleCount--
      })
    }

    // Créer moins de particules au démarrage
    for (let i = 0; i < 10; i++) {
      setTimeout(createParticle, i * 200)
    }

    // Réduire la fréquence de création
    const particleInterval = setInterval(createParticle, 500)

    return () => {
      clearInterval(particleInterval)
      if (particlesRef.current) {
        particlesRef.current.innerHTML = ''
      }
    }
  }, [isVisible])

  return (
    <section className="server-rental-section" id="servers">
      <div className="space-particles" ref={particlesRef}></div>
      <div className="server-container">
        <div className="section-header">
          <h2 className="section-title" data-text="Serveurs Space Engineers 2">
            Serveurs Space Engineers 2
          </h2>
          <p className="section-subtitle">Lancez votre aventure spatiale en quelques clics</p>
          <div className="section-description">
            <div className="description-block">
              <FiServer className="description-icon" />
              <h3>Performance Garantie</h3>
              <p>Serveurs haute performance avec une disponibilité de 99.9% pour une expérience de jeu optimale</p>
            </div>
            <div className="description-block">
              <FiShield className="description-icon" />
              <h3>Sécurité Maximale</h3>
              <p>Protection DDoS avancée et sauvegardes automatiques pour une tranquillité d'esprit totale</p>
            </div>
            <div className="description-block">
              <FiCpu className="description-icon" />
              <h3>Installation Instantanée</h3>
              <p>Déployez votre serveur en moins de 60 secondes et commencez votre aventure immédiatement</p>
            </div>
          </div>
        </div>

        <div className="server-plans-grid">
          {serverPlans.map(plan => (
            <div 
              key={plan.id} 
              className={`server-plan-card ${plan.recommended ? 'recommended' : ''}`}
            >
              <div className="glitch-effect"></div>
              {plan.recommended && (
                <div className="recommended-badge">
                  <span className="badge-text">Recommandé</span>
                  <span className="badge-icon">★</span>
                </div>
              )}
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-price">{plan.price}</p>
              </div>
              <div className="plan-features">
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-icon">
                        {feature.icon}
                      </span>
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="cta-button">
                <span className="button-text">Activer</span>
                <span className="button-icon">→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 