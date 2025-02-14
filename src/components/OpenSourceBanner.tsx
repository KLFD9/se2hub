import { FaGithub } from 'react-icons/fa';
import '../styles/components/OpenSourceBanner.css';

export const OpenSourceBanner = () => {
  return (
    <div className="opensource-banner">
      <div className="opensource-content">
        <p>
          <span className="highlight"><FaGithub /> Open Source & Collaboration</span>
          Engineers Hub est un projet open source. Vos idées, contributions et suggestions sont les bienvenues pour faire évoluer la plateforme ensemble.
        </p>
        <a
          href="https://github.com/KLFD9/se2hub"
          target="_blank"
          rel="noopener noreferrer"
          className="github-button"
        >
          <FaGithub /> Contribuer sur GitHub
        </a>
      </div>
    </div>
  );
};