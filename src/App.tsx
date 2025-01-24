import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import NewsSection from './components/NewsSection';
import { FeaturesGrid } from './components/FeaturesGrid';
import { CommunityGallery } from './components/CommunityGallery';
import { Footer } from './components/Footer'
import Spaceflix from './pages/Spaceflix';
import './styles/App.css'
import React, { useEffect, useState } from 'react';
import { getAllSocialPosts } from './services/socialMedia';
import type { SocialPost } from './services/socialMedia';

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const socialPosts = await getAllSocialPosts();
        setPosts(socialPosts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching social posts:', error);
        setError('Erreur lors de la récupération des posts');
        setLoading(false);
      }
    };

    fetchPosts();

    // Rafraîchir les posts toutes les 5 minutes
    const interval = setInterval(fetchPosts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      <Hero />
      {loading ? (
        <div className="loading">Chargement des actualités...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <NewsSection posts={posts} />
      )}
      <FeaturesGrid />
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
          <Route path="/spaceflix" element={<Spaceflix />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
