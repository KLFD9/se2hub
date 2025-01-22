import React, { useState, useEffect } from 'react';
import { FaYoutube, FaPlay, FaExternalLinkAlt, FaEye, FaHeart } from 'react-icons/fa';
import { formatNumber } from '../utils/formatters';
import { SocialPost } from '../services/socialMedia';
import VideoModal from './VideoModal';
import SkeletonCard from './SkeletonCard';
import '../styles/components/NewsSection.css';

interface CardProps {
  post: SocialPost;
  onVideoSelect: (videoId: string) => void;
}

const SocialCard: React.FC<CardProps> = ({ post, onVideoSelect }) => (
  <article 
    className="social-card"
    onClick={() => onVideoSelect(post.videoId)}
  >
    <div 
      className="card-thumbnail" 
      style={{ backgroundImage: `url(${post.thumbnail})` }} 
    />
    <div className="play-overlay">
      <button className="play-button">
        <FaPlay size={24} />
      </button>
    </div>
    <div className="card-overlay">
      <div className="social-card-header">
        <FaYoutube className="platform-icon" />
        <span className="author">{post.author}</span>
      </div>
      <div className="card-content">
        <p className="content-text">{post.content}</p>
        <div className="social-stats">
          <span className="date">{post.date}</span>
          <span className="views">
            <FaEye />
            <span>{formatNumber(post.views)} vues</span>
          </span>
          <span className="likes">
            <FaHeart />
            <span>{formatNumber(post.likes)} likes</span>
          </span>
          {post.avatar && (
            <img 
              src={post.avatar} 
              alt={`Avatar de ${post.author}`} 
              className="creator-avatar"
            />
          )}
        </div>
      </div>
      <button 
        className="watch-button"
        onClick={(e) => {
          e.stopPropagation();
          onVideoSelect(post.videoId);
        }}
      >
        <FaPlay size={14} />
        Regarder la vidéo
      </button>
    </div>
    <a
      href={`https://youtube.com/watch?v=${post.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="youtube-link"
      onClick={(e) => e.stopPropagation()}
      title="Voir sur YouTube"
    >
      <FaExternalLinkAlt size={14} />
    </a>
  </article>
);

const NewsSection: React.FC<{ posts: SocialPost[] }> = ({ posts }) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [displayedPosts, setDisplayedPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  useEffect(() => {
    setIsLoading(true);
    // Simuler un délai de chargement pour montrer le skeleton
    setTimeout(() => {
      setDisplayedPosts(posts.slice(0, postsPerPage));
      setIsLoading(false);
    }, 1000);
  }, [posts]);

  const loadMore = () => {
    setIsLoading(true);
    const nextPage = currentPage + 1;
    setTimeout(() => {
      setDisplayedPosts(posts.slice(0, nextPage * postsPerPage));
      setCurrentPage(nextPage);
      setIsLoading(false);
    }, 500);
  };

  const hasMorePosts = posts.length > displayedPosts.length;

  return (
    <section className="social-feed-section">
      <div className="social-container">
        <header className="section-header">
          <h2 className="section-title">Dernières Actualités</h2>
        </header>
        <div className="social-grid">
          {isLoading && displayedPosts.length === 0 ? (
            <>
              <SkeletonCard isFirst={true} />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              {displayedPosts.map((post) => (
                <SocialCard
                  key={post.id}
                  post={post}
                  onVideoSelect={setSelectedVideo}
                />
              ))}
              {isLoading && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}
            </>
          )}
        </div>
        {hasMorePosts && (
          <div className="load-more-container">
            <button 
              className="load-more-button"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Chargement...' : 'Charger plus'}
            </button>
          </div>
        )}
      </div>
      {selectedVideo && (
        <VideoModal
          videoId={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </section>
  );
};

export default NewsSection; 