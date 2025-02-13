import { useState, useEffect } from 'react'
import { BiMenu, BiHome, BiImage, BiGroup, BiVideo, BiSolidWrench } from 'react-icons/bi'
import { FaGithub } from 'react-icons/fa'
import { Link, useLocation } from 'react-router-dom'
import '../styles/components/Navbar.css'

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationItems = [
    { label: 'Accueil', path: '/', icon: BiHome },
    { label: 'Galerie', path: '/gallery', icon: BiImage },
    { label: 'Spaceflix', path: '/spaceflix', icon: BiVideo },
    { label: 'Outils', path: '/tools', icon: BiSolidWrench },
    { label: 'Communauté', path: '/community', icon: BiGroup }
  ]

  const handleNavClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="logo" onClick={handleNavClick}>
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
                    onClick={handleNavClick}
                  >
                    <Icon className="nav-icon" />
                    <span className="link-text">{item.label}</span>
                    <span className="link-decoration" />
                  </Link>
                </div>
              )
            })}
            <a href="#" className="github-cta">
              <FaGithub className="github-icon" />
              <span>Contribuer</span>
            </a>
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