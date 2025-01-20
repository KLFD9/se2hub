import '../styles/components/Footer.css'

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Space Engineers 2</h3>
            <p className="footer-description">
              Le futur de l'ingénierie spatiale commence ici. 
              Rejoignez-nous dans cette nouvelle aventure.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">Twitter</a>
              <a href="#" className="social-link">Discord</a>
              <a href="#" className="social-link">YouTube</a>
              <a href="#" className="social-link">Reddit</a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Liens Rapides</h4>
            <ul className="footer-links">
              <li><a href="#news">Actualités</a></li>
              <li><a href="#features">Fonctionnalités</a></li>
              <li><a href="#community">Communauté</a></li>
              <li><a href="#guides">Guides</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Support</h4>
            <ul className="footer-links">
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Support Technique</a></li>
              <li><a href="#">Signaler un Bug</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Légal</h4>
            <ul className="footer-links">
              <li><a href="#">Conditions d'Utilisation</a></li>
              <li><a href="#">Politique de Confidentialité</a></li>
              <li><a href="#">Mentions Légales</a></li>
              <li><a href="#">EULA</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-logo">
            <span className="logo-text">SE2 Hub</span>
          </div>
          <p className="copyright">
            © 2024 Space Engineers 2 Hub. Tous droits réservés.
          </p>
          <div className="language-selector">
            <select>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </div>

      <div className="footer-decoration">
        <div className="star-field"></div>
      </div>
    </footer>
  )
} 