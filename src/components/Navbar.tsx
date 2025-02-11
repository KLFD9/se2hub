import { useState, useEffect } from 'react'
import { BiMenu, BiNews, BiHome, BiImage, BiGroup, BiCube, BiVideo, BiSolidWrench } from 'react-icons/bi'
import { Link, useLocation } from 'react-router-dom'
import '../styles/components/Navbar.css'

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showHomeSubmenu, setShowHomeSubmenu] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navigation principale (toujours visible)
  const navigationItems = [
    { label: 'Accueil', path: '/', icon: BiHome },
    { label: 'Galerie', path: '/gallery', icon: BiImage },
    { label: 'Spaceflix', path: '/spaceflix', icon: BiVideo },
    { label: 'Outils', path: '/tools', icon: BiSolidWrench },
    { label: 'Communauté', path: '/community', icon: BiGroup }
  ]

  // Sections de la page d'accueil (sous-menu)
  const homeSections = [
    { label: 'Actualités', id: 'news-section', icon: BiNews },
    { label: 'Fonctionnalités', id: 'features-grid', icon: BiCube },
    { label: 'Communauté', id: 'community-section', icon: BiGroup }
  ]

  const handleSectionClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const navHeight = 80 // Hauteur de la navbar
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - navHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    setIsMobileMenuOpen(false)
    setShowHomeSubmenu(false)
  }

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false)
    setShowHomeSubmenu(path === '/' && location.pathname === '/')
  }

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="logo" onClick={() => handleNavClick('/')}>
          <div className="logo-wrapper">
            <div className="logo-main">
              <span className="logo-glitch" data-text="SE2">SE2</span>
              <span className="logo-sub" data-text="HUB">HUB</span>
            </div>
          </div>
        </Link>

        <div className="nav-content">
          <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <div key={item.path} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
                    onClick={() => handleNavClick(item.path)}
                  >
                    <Icon className="nav-icon" />
                    <span className="link-text">{item.label}</span>
                    <span className="link-decoration" />
                  </Link>
                  
                  {item.path === '/' && location.pathname === '/' && showHomeSubmenu && (
                    <div className="home-submenu">
                      {homeSections.map((section) => {
                        const SectionIcon = section.icon
                        return (
                          <button
                            key={section.id}
                            onClick={() => handleSectionClick(section.id)}
                            className="submenu-link"
                          >
                            <SectionIcon className="nav-icon" />
                            <span className="link-text">{section.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <BiMenu />
        </button>
      </div>
      
      <div className="navbar-decoration">
        <div className="decoration-line" />
      </div>
    </nav>
  )
} 