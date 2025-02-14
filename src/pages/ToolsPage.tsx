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
        progress: 0,
        status: 'Planifié',
        githubUrl: "https://github.com/engineers-hub/ResourceTracker"
    },
    {
        title: "PowerGrid",
        description: "Analysez et optimisez la distribution d'énergie",
        path: "/tools/power",
        icon: "⚡",
        tags: ["Énergie", "Analyse"],
        creator: "@PowerTeam",
        progress: 0,
        status: 'Planifié',
        githubUrl: "https://github.com/engineers-hub/PowerGrid"
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
            <div 
                className="tool-card planned"
                key={index}
                data-tool={tool.title}
            >
                {children}
            </div>
        );
    }

    return (
        <Link 
            to={tool.path}
            className="tool-card"
            key={index}
            data-tool={tool.title}
        >
            {children}
        </Link>
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
            </>
        );

        return (
            <CardWrapper tool={tool} index={index}>
                {cardContent}
            </CardWrapper>
        );
    };

    return (
        <div className="tools-container">
            <section className="tools-hero">
                <div className="floating-particles" aria-hidden="true"></div>
                <div className="tools-hero-scanline" aria-hidden="true"></div>
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
                    <div className="tools-grid">
                        {tools.map((tool, index) => renderToolCard(tool, index))}
                    </div>
                </div>
            </section>

            <section className="faq-section">
                <div className="faq-container">
                    <h2 className="section-title" data-text="Questions Fréquentes">Questions Fréquentes</h2>
                    <div className="faq-grid" role="list">
                        {[
                            {
                                question: "Comment contribuer aux outils ?",
                                answer: "Signalez des bugs, proposez des améliorations ou soumettez du code via GitHub. Chaque contribution aide à améliorer les outils pour la communauté."
                            },
                            {
                                question: "Les outils sont-ils gratuits ?",
                                answer: "Tous nos outils sont 100% gratuits et open source, développés par et pour la communauté Space Engineers."
                            },
                            {
                                question: "Comment signaler un bug ?",
                                answer: "Créez une \"Issue\" sur GitHub avec une description détaillée du problème et les étapes pour le reproduire."
                            },
                            {
                                question: "Besoin d'aide avec un outil ?",
                                answer: "Rejoignez notre Discord pour obtenir de l'aide directe de la communauté et des développeurs."
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
                                <p className="faq-answer">
                                    {faq.answer}
                                </p>
                            </article>
                        ))}
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
        </div>
    );
};

export default ToolsPage;