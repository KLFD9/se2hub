import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaQuestion, FaDiscord } from 'react-icons/fa';
import { BiChevronRight, BiGitBranch } from 'react-icons/bi';
import '../styles/pages/Tools.css';

interface ToolCard {
  title: string;
  description: string;
  path: string;
  icon: string;
  tags: string[];
  creator: string;
  progress: number;
  status: 'En développement' | 'completed' | 'Planifié';
  githubUrl?: string;
}

const tools: ToolCard[] = [
  {
    title: 'SpaceCalc',
    description: 'Calculateur de propulseurs et énergie pour vos vaisseaux',
    path: '/tools/spacecalc',
    icon: '🚀',
    tags: ['Calculatrice', 'Propulseurs'],
    creator: '@SE2HubTeam',
    progress: 60,
    status: 'En développement',
    githubUrl: 'https://github.com/engineers-hub/SpaceCalc'
  },
  {
    title: 'ResourceTracker',
    description: 'Suivez et gérez vos ressources spatiales efficacement',
    path: '/tools/resources',
    icon: '📊',
    tags: ['Ressources', 'Planning'],
    creator: '@ResourceTeam',
    progress: 0,
    status: 'Planifié',
    githubUrl: 'https://github.com/engineers-hub/ResourceTracker'
  },
  {
    title: 'PowerGrid',
    description: "Analysez et optimisez la distribution d'énergie",
    path: '/tools/power',
    icon: '⚡',
    tags: ['Énergie', 'Analyse'],
    creator: '@PowerTeam',
    progress: 0,
    status: 'Planifié',
    githubUrl: 'https://github.com/engineers-hub/PowerGrid'
  }
];

type CardWrapperProps = {
  children: React.ReactNode;
  tool: ToolCard;
  index: number;
};

const CardWrapper: React.FC<CardWrapperProps> = ({ children, tool, index }) => {
  if (tool.status === 'Planifié') {
    return (
      <article
        className="tool-card planned"
        key={index}
        data-tool={tool.title}
        aria-label={`Outil planifié : ${tool.title}`}
      >
        {children}
      </article>
    );
  }

  return (
    <div className="tool-card" data-tool={tool.title}>
      {children}
    </div>
  );
};

const ToolsPage: React.FC = () => {
  const [activeFaqItem, setActiveFaqItem] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaqItem(activeFaqItem === index ? null : index);
  };

  const renderToolCard = (tool: ToolCard, index: number) => {
    const cardContent = (
      <>
        <div className="tool-header">
          <div className="tool-title-group">
            <h2>{tool.title}</h2>
            <span className="tool-creator">{tool.creator}</span>
          </div>
          {tool.status !== 'Planifié' && <BiChevronRight className="tool-icon" />}
        </div>

        <p className="tool-description">{tool.description}</p>

        <div className="tool-tags">
          {tool.tags.map((tag, tagIndex) => (
            <span key={tagIndex} className="tool-tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="tool-footer">
          <div className="tool-progress">
            <div
              className="tool-progress-bar"
              style={{ width: `${tool.progress}%` }}
            />
          </div>
          <div className="tool-actions">
            <span className={`tool-status ${tool.status.toLowerCase()}`}>
              <BiGitBranch />
              {tool.status}
            </span>
            {tool.githubUrl && tool.status !== 'Planifié' && (
              <span
                className="tool-action-btn"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(tool.githubUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <FaGithub />
              </span>
            )}
          </div>
        </div>
      </>
    );

    const cardElement = (
      <CardWrapper tool={tool} index={index}>
        {cardContent}
      </CardWrapper>
    );

    return tool.status === 'Planifié' ? (
      cardElement
    ) : (
      <Link
        to={tool.path}
        className="tool-card-link"
        key={index}
        aria-label={`Accéder à l'outil : ${tool.title}`}
      >
        {cardElement}
      </Link>
    );
  };

  return (
    <>
      {/* Ex. balises SEO (React Helmet) - Optionnel */}
      {/* 
      <Helmet>
        <title>Outils Communautaires | Space Engineers</title>
        <meta
          name="description"
          content="Une collection d'outils open source pour optimiser votre expérience Space Engineers."
        />
      </Helmet>
      */}

      <main className="tools-container">
        <header className="tools-hero" aria-label="Section Héro Outils">
          <div className="tools-hero-inner">
            <div className="tools-hero-content">
              <div className="hero-text-container">
                <h1>Outils Communautaires Space Engineers</h1>
                <p>
                  Une collection d'outils open source conçus pour optimiser votre expérience Space Engineers. 
                  Développés par la communauté, pour la communauté.
                </p>
                <div className="hero-actions">
                  <a
                    href="https://github.com/engineers-hub"
                    className="tools-cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaGithub /> Contribuer sur GitHub
                  </a>
                </div>
              </div>
            </div>
            <section className="tools-grid" aria-label="Liste des outils">
              {tools.map((tool, index) => renderToolCard(tool, index))}
            </section>
          </div>
        </header>

        <section className="faq-section" aria-labelledby="faq-heading">
          <div className="faq-container">
            <h2
              className="section-title"
              data-text="Questions Fréquentes"
              id="faq-heading"
            >
              Questions Fréquentes
            </h2>
            <div className="faq-grid" role="list">
              {[
                {
                  question: 'Comment contribuer aux outils ?',
                  answer:
                    'Signalez des bugs, proposez des améliorations ou soumettez du code via GitHub. Chaque contribution aide à améliorer les outils pour la communauté.'
                },
                {
                  question: 'Les outils sont-ils gratuits ?',
                  answer:
                    'Tous nos outils sont 100% gratuits et open source, développés par et pour la communauté Space Engineers.'
                },
                {
                  question: 'Comment signaler un bug ?',
                  answer:
                    'Créez une "Issue" sur GitHub avec une description détaillée du problème et les étapes pour le reproduire.'
                },
                {
                  question: 'Besoin d\'aide avec un outil ?',
                  answer:
                    'Rejoignez notre Discord pour obtenir de l’aide directe de la communauté et des développeurs.'
                }
              ].map((faq, index) => (
                <article
                  className={`faq-item ${activeFaqItem === index ? 'active' : ''}`}
                  role="listitem"
                  key={index}
                  onClick={() => toggleFaq(index)}
                >
                  <h3 className="faq-question">
                    <FaQuestion aria-hidden="true" />
                    <span>{faq.question}</span>
                  </h3>
                  <p className="faq-answer">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="get-started-section" aria-label="Rejoignez la Communauté">
          <div className="get-started-content">
            <h2 className="get-started-title">Rejoignez la Communauté</h2>
            <p className="get-started-description">
              Participez au développement des outils, partagez vos idées et connectez-vous avec d'autres passionnés
              de Space Engineers.
            </p>
            <div className="get-started-buttons">
              <a
                href="https://github.com/KLFD9/se2hub"
                className="github-button primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaGithub /> Explorer le Code
              </a>
              <a
                href="https://discord.gg/engineers-hub"
                className="github-button secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaDiscord /> Rejoindre Discord
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ToolsPage;
