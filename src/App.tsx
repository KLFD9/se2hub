import { BrowserRouter as Router } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import NewsSection from './components/NewsSection';
import { FeaturesGrid } from './components/FeaturesGrid';
import { ServerRentalSection } from './components/ServerRentalSection';
import { Footer } from './components/Footer'
import './styles/App.css'
import React, { useEffect, useState } from 'react';
import { getAllSocialPosts } from './services/socialMedia';
import type { SocialPost } from './services/socialMedia';

const App: React.FC = () => {
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
    <Router>
      <div className="app">
        <Navbar />
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
          <ServerRentalSection />
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
