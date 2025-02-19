import {FaUsers, FaRocket, FaCode, FaLightbulb, FaBook, FaGithub, FaTools } from 'react-icons/fa';

import '../styles/pages/CommunityPage.css';

const CommunityPage = () => {


  const features = [
    {
      icon: FaUsers,
      title: "Communauté Spatiale",
      description: "Rejoignez une communauté passionnée d'explorateurs spatiaux. Partagez vos découvertes et enrichissez vos connaissances."
    },
    {
      icon: FaRocket,
      title: "Projets Innovants",
      description: "Participez à des projets révolutionnaires qui façonnent l'avenir de l'exploration spatiale. Chaque contribution compte."
    },
    {
      icon: FaCode,
      title: "Open Source",
      description: "Contribuez au développement de SE2Hub et aidez-nous à créer la meilleure plateforme spatiale communautaire."
    }
  ];

  const infoCards = [
    {
      icon: FaLightbulb,
      title: "Pourquoi rejoindre SE2Hub ?",
      description: "Une plateforme unique dédiée à l'exploration spatiale, combinant ressources éducatives et outils collaboratifs."
    },
    {
      icon: FaBook,
      title: "Documentation Complète",
      description: "Accédez à une documentation détaillée et contribuez à son amélioration pour aider la communauté à grandir."
    }
  ];

  return (
    <div className="community-page">

      <div className="community-container">
        <div className="community-header">
          <div className="construction-badge">
            <FaTools />
            Bientôt disponible
          </div>
          
          <h1 className="community-title">
            Explorez l'Infini
          </h1>

          <p className="community-subtitle">
            Une nouvelle ère de l'exploration spatiale commence ici.
            Rejoignez une communauté d'innovateurs et de passionnés qui repoussent les frontières du possible.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <feature.icon className="feature-icon" />
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="info-cards">
          {infoCards.map((card, index) => (
            <div key={index} className="info-card">
              <card.icon className="info-card-icon" />
              <div className="info-card-content">
                <h4 className="info-card-title">{card.title}</h4>
                <p className="info-card-description">{card.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="community-cta">
          <p className="cta-text">
            Prêt à repousser les frontières de l'exploration spatiale ?
          </p>
          
          <a
            href="https://github.com/KLFD9/se2hub"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button"
          >
            <FaGithub />
            Rejoindre l'Aventure
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 