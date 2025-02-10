import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturesGrid } from './components/FeaturesGrid';
import { CommunityGallery } from './components/CommunityGallery';
import { ArticlePage } from './components/ArticlePage';
import { Footer } from './components/Footer';
import YoutubeLogsPage from './pages/YoutubeLogsPage';
import SpaceflixPage from './pages/SpaceflixPage';
import ToolsPage from './pages/ToolsPage';
import SpaceCalcPage from './pages/SpaceCalcPage';
import './styles/App.css';
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <main>
      <Hero />
      <FeaturesGrid />
      <section className="social-section" id="social-section"></section>
    </main>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery" element={<CommunityGallery />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/youtube-logs" element={<YoutubeLogsPage />} />
          <Route path="/spaceflix" element={<SpaceflixPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/spacecalc" element={<SpaceCalcPage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
