import '../styles/components/Footer.css'
import { FaDiscord, FaTwitter, FaYoutube, FaReddit } from 'react-icons/fa'
import React from 'react'

interface FooterLink {
  label: string
  href: string
  ariaLabel?: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: "Navigation",
    links: [
      { label: "Accueil", href: "/", ariaLabel: "Retour à l'accueil" },
      { label: "Galerie", href: "/gallery", ariaLabel: "Voir la galerie" },
      { label: "Spaceflix", href: "/spaceflix", ariaLabel: "Accéder à Spaceflix" },
      { label: "Outils", href: "/tools", ariaLabel: "Accéder aux outils" },
      { label: "Communauté", href: "/community", ariaLabel: "Rejoindre la communauté" }
    ]
  },
  {
    title: "Ressources",
    links: [
      { label: "Calculateur", href: "/tools#calculator", ariaLabel: "Utiliser le calculateur" },
      { label: "Blueprints", href: "/tools#blueprints", ariaLabel: "Explorer les blueprints" },
      { label: "Guides", href: "/tools#guides", ariaLabel: "Consulter les guides" }
    ]
  },
  {
    title: "Communauté",
    links: [
      { label: "À venir", href: "#", ariaLabel: "Fonctionnalité à venir" }
    ]
  }
]

const socialLinks = [
  { icon: FaDiscord, label: "Discord", href: "https://discord.gg/keenswh", ariaLabel: "Rejoindre le Discord officiel de Space Engineers" },
  { icon: FaTwitter, label: " / X", href: "https://x.com/SpaceEngineersG", ariaLabel: "Suivre Space Engineers sur X" },
  { icon: FaYoutube, label: "YouTube", href: "https://www.youtube.com/@SpaceEngineers", ariaLabel: "S'abonner à la chaîne YouTube officielle de Space Engineers" },
  { icon: FaReddit, label: "Reddit", href: "https://www.reddit.com/r/spaceengineers/", ariaLabel: "Rejoindre le subreddit officiel de Space Engineers" }
]

export const Footer = () => {
  const currentYear = new Date().getFullYear()
  const planetRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleScroll = () => {
      if (!planetRef.current) return
      
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollProgress = scrollPosition / (documentHeight - windowHeight)
      const offsetY = scrollProgress * 100
      const offsetX = Math.sin(scrollProgress * Math.PI) * 30
      
      planetRef.current.style.setProperty('--scroll-offset-y', String(offsetY))
      planetRef.current.style.setProperty('--scroll-offset-x', String(offsetX))
      planetRef.current.classList.add('parallax-scroll')
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <footer className="footer" role="contentinfo" aria-label="Pied de page">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section main-section">
            <a href="/" className="footer-logo" aria-label="Retour à l'accueil">
              <div className="logo-wrapper">
                <div className="logo-main">
                  <span className="logo-glitch" data-text="SE2">SE2</span>
                  <span className="logo-sub" data-text="HUB">HUB</span>
                </div>
              </div>
            </a>
            <p className="footer-description">
              Votre communauté francophone dédiée aux passionnés de Space Engineers. 
              Partagez, apprenez et construisez ensemble.
            </p>
            <div className="social-links">
              {socialLinks.map(({ icon: Icon, label, href, ariaLabel }) => (
                <a 
                  key={label}
                  href={href}
                  className="social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ariaLabel}
                >
                  <Icon aria-hidden="true" />
                  <span className="social-label">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="footer-section">
              <h4>{section.title}</h4>
              <ul className="footer-links">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      aria-label={link.ariaLabel}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="disclaimer">
          <p>
            Engineers Hub est un site communautaire créé par des fans. 
            Nous ne sommes pas affiliés à Keen Software House ni à Space Engineers. 
            Space Engineers est une marque déposée de Keen Software House.
          </p>
        </div>

        <div className="footer-bottom">
          <div className="footer-logo">
          </div>
          <p className="copyright">
            © {currentYear} SE2HUB. Site communautaire non-officiel.
          </p>
          <div className="language-selector">
            <select aria-label="Sélectionner la langue" onChange={(e) => console.log('Langue sélectionnée:', e.target.value)}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </div>

      <div className="footer-decoration">
        <div className="space-fog"></div>
        <div className="star-field"></div>
        <div className="planet" ref={planetRef}>
          <div className="asteroid-shadow"></div>
          <div className="asteroid-base"></div>
          <div className="asteroid-texture"></div>
          <div className="asteroid-glow"></div>
        </div>
      </div>
    </footer>
  )
}