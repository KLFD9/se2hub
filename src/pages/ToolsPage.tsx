import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages/Tools.css';

interface ToolCard {
    title: string;
    description: string;
    path: string;
    icon: string;
}

const tools: ToolCard[] = [
    {
        title: "SpaceCalc",
        description: "Calculateur de poussée pour vos vaisseaux spatiaux",
        path: "/tools/spacecalc",
        icon: "🚀"
    },
    // D'autres outils pourront être ajoutés ici
];

const ToolsPage: React.FC = () => {
    return (
        <div className="tools-container">
            <h1>Outils Spatiaux</h1>
            <div className="tools-grid">
                {tools.map((tool, index) => (
                    <Link to={tool.path} key={index} className="tool-card">
                        <div className="tool-icon">{tool.icon}</div>
                        <h2>{tool.title}</h2>
                        <p>{tool.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ToolsPage; 