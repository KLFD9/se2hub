import { useState, useEffect } from 'react'
import { HiOutlineSearch } from 'react-icons/hi'
import '../styles/components/Navbar.css'

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="logo">
          <span className="logo-text">SE2 Hub</span>
        </div>
        
        <div className="nav-links">
          <a href="#news" className="nav-link">Actualités</a>
          <a href="#features" className="nav-link">Fonctionnalités</a>
          <a href="#community" className="nav-link">Communauté</a>
          <a href="#guides" className="nav-link">Guides</a>
        </div>

        <div className="nav-actions">
          <div className="search-container">
            <HiOutlineSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Rechercher..."
              className="search-input"
            />
          </div>
        </div>
      </div>
    </nav>
  )
} 