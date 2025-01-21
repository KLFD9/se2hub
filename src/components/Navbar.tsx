import { useState, useEffect } from 'react'
import { BiMenu } from 'react-icons/bi'
import '../styles/components/Navbar.css'

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      <div className="navbar-container">
        <a href="/" className="logo">
          <div className="logo-wrapper">
            <div className="logo-main">
              <span className="logo-glitch" data-text="SE2">SE2</span>
              <span className="logo-sub" data-text="HUB">HUB</span>
            </div>
          </div>
        </a>

        <div className="nav-content">
          <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            {['Actualités', 'Fonctionnalités', 'Communauté', 'Guides'].map((item, index) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="nav-link"
                style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
              >
                <span className="link-text">{item}</span>
                <span className="link-decoration" />
              </a>
            ))}
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