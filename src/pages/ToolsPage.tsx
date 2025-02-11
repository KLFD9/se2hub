import React from 'react';
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
        title: "SpaceCalc",
        description: "Calculateur de propulseurs et énergie pour vos vaisseaux",
        path: "/tools/spacecalc",
        icon: "🚀",
        tags: ["Calculatrice", "Propulseurs"],
        creator: "@SE2HubTeam",
        progress: 60,
        status: 'En développement',
        githubUrl: "https://github.com/engineers-hub/SpaceCalc"
    },
    {
        title: "ResourceTracker",
        description: "Suivez et gérez vos ressources spatiales efficacement",
        path: "/tools/resources",
        icon: "📊",
        tags: ["Ressources", "Planning"],
        creator: "@ResourceTeam",
        progress: 45,
        status: 'En développement',
        githubUrl: "https://github.com/engineers-hub/ResourceTracker"
    },
    {
        title: "PowerGrid",
        description: "Analysez et optimisez la distribution d'énergie",
        path: "/tools/power",
        icon: "⚡",
        tags: ["Énergie", "Analyse"],
        creator: "@PowerTeam",
        progress: 100,
        status: 'Planifié',
        githubUrl: "https://github.com/engineers-hub/PowerGrid"
    }
];

const ToolsPage: React.FC = () => {
    return (
        <div className="tools-container">
            <section className="tools-hero">
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
            </section>

            <section className="tools-section">
                <h2 className="section-title" data-text="Outils Disponibles">Outils Disponibles</h2>
                <div className="tools-grid">
                    {tools.map((tool, index) => (
                        <Link 
                            to={tool.path} 
                            key={index} 
                            className="tool-card"
                            data-tool={tool.title}
                        >
                            <div className="tool-header">
                                <div className="tool-title-group">
                                    <h2>{tool.title}</h2>
                                    <span className="tool-creator">{tool.creator}</span>
                                </div>
                                <BiChevronRight className="tool-icon" />
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
                                    <span className={`tool-status ${tool.status}`}>
                                        <BiGitBranch />
                                        {tool.status}
                                    </span>
                                    {tool.githubUrl && (
                                        <a 
                                            href={tool.githubUrl}
                                            className="tool-action-btn"
                                            onClick={(e) => e.stopPropagation()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <FaGithub />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="faq-section">
                <div className="faq-container">
                    <h2 className="section-title" data-text="Questions Fréquentes">Questions Fréquentes</h2>
                    <div className="faq-grid" role="list">
                        <article className="faq-item" role="listitem">
                            <h3 className="faq-question">
                                <FaQuestion aria-hidden="true" />
                                <span>Comment contribuer aux outils ?</span>
                            </h3>
                            <p className="faq-answer">
                                Signalez des bugs, proposez des améliorations ou soumettez du code via GitHub. Chaque contribution aide à améliorer les outils pour la communauté.
                            </p>
                        </article>
                        <article className="faq-item" role="listitem">
                            <h3 className="faq-question">
                                <FaQuestion aria-hidden="true" />
                                <span>Les outils sont-ils gratuits ?</span>
                            </h3>
                            <p className="faq-answer">
                                Tous nos outils sont 100% gratuits et open source, développés par et pour la communauté Space Engineers.
                            </p>
                        </article>
                        <article className="faq-item" role="listitem">
                            <h3 className="faq-question">
                                <FaQuestion aria-hidden="true" />
                                <span>Comment signaler un bug ?</span>
                            </h3>
                            <p className="faq-answer">
                                Créez une "Issue" sur GitHub avec une description détaillée du problème et les étapes pour le reproduire.
                            </p>
                        </article>
                        <article className="faq-item" role="listitem">
                            <h3 className="faq-question">
                                <FaQuestion aria-hidden="true" />
                                <span>Besoin d'aide avec un outil ?</span>
                            </h3>
                            <p className="faq-answer">
                                Rejoignez notre Discord pour obtenir de l'aide directe de la communauté et des développeurs.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="get-started-section">
                <div className="get-started-content">
                    <h2 className="get-started-title">Rejoignez la Communauté</h2>
                    <p className="get-started-description">
                        Participez au développement des outils, partagez vos idées et connectez-vous avec d'autres passionnés
                        de Space Engineers.
                    </p>
                    <div className="get-started-buttons">
                        <a 
                            href="https://github.com/engineers-hub" 
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
        </div>
    );
};

export default ToolsPage;