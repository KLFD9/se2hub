import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturesGrid } from './components/FeaturesGrid';
import { CommunityGallery } from './components/CommunityGallery';
import { ArticlePage } from './components/ArticlePage';
import { Footer } from './components/Footer';
import './styles/App.css'
import React from 'react';

const HomePage: React.FC = () => {
  return (
    <main>
      <Hero />
      <FeaturesGrid />
      <section className="social-section" id="social-section">
      </section>
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
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
