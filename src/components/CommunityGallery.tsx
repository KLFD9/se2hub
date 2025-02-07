import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BiHeart, BiComment, BiUser, BiSearch } from 'react-icons/bi';
import { steamService, SteamScreenshot } from '../services/steamService';
import { ImageModal } from './ImageModal';
import '../styles/components/CommunityGallery.css';

const SkeletonLoader = () => {
  return (
    <div className="skeleton-item">
      <div className="skeleton-image" />
      <div className="skeleton-overlay">
        <div className="skeleton-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
        <div className="skeleton-title" />
        <div className="skeleton-description" />
        <div className="skeleton-author">
          <div className="skeleton-avatar" />
          <div className="skeleton-name" />
        </div>
        <div className="skeleton-stats">
          <div className="skeleton-stat" />
          <div className="skeleton-stat" />
        </div>
      </div>
    </div>
  );
};

const SkeletonGrid = () => (
  <div className="gallery-loading">
    {[...Array(9)].map((_, index) => (
      <SkeletonLoader key={index} />
    ))}
  </div>
);

export const CommunityGallery: React.FC = () => {
  const [images, setImages] = useState<SteamScreenshot[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<SteamScreenshot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchImages = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }
      const newImages = await steamService.getScreenshots({
        page: pageNum,
      });

      setImages(prev => pageNum === 1 ? newImages : [...prev, ...newImages]);
      setHasMore(newImages.length > 0);
      setError(null);
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
      setError('Impossible de charger les images. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  const observer = useRef<IntersectionObserver>();
  const lastImageRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    setPage(1);
    fetchImages(1);
  }, [fetchImages]);

  useEffect(() => {
    if (page > 1) {
      fetchImages(page);
    }
  }, [page, fetchImages]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const filteredImages = React.useMemo(() => {
    return images.filter(image => 
      image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [images, searchQuery]);

  return (
    <div className="community-gallery">
      <div className="gallery-container">
        <main className="gallery-content">
          <div className="gallery-header">
            <h1>
              <span className="gradient-text" data-text="Galerie">Galerie</span>
              <span className="subtitle">Communautaire</span>
            </h1>
            <p>Explorez et partagez vos créations Space Engineers avec la communauté</p>
            <div className="search-container">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Rechercher des vaisseaux, stations, bases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <BiSearch className="search-icon" />
              </div>
            </div>
          </div>

          {error ? (
            <div className="gallery-error">
              <p>{error}</p>
              <button onClick={() => fetchImages(1)}>Réessayer</button>
            </div>
          ) : initialLoading ? (
            <SkeletonGrid />
          ) : (
            <>
              <div className="gallery-grid">
                {filteredImages.map((image, index) => (
                  <div
                    key={image.id}
                    ref={index === filteredImages.length - 1 ? lastImageRef : undefined}
                    className="gallery-item"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="image-container">
                      <img src={image.url} alt={image.title} loading="lazy" />
                      <div className="image-overlay">
                        <div className="image-tags">
                          {image.tags.map((tag, idx) => (
                            <span key={idx} className="image-tag">{tag}</span>
                          ))}
                        </div>
                        <h3>{image.title}</h3>
                        {image.description && (
                          <p className="image-description">{image.description}</p>
                        )}
                        <div className="author">
                          <div className="author-avatar">
                            {image.author.avatarUrl ? (
                              <img 
                                src={image.author.avatarUrl} 
                                alt={`Avatar de ${image.author.name}`}
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  const parent = img.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<BiUser size={16} color="rgba(255, 255, 255, 0.9)" />`;
                                  }
                                }}
                              />
                            ) : (
                              <BiUser size={16} color="rgba(255, 255, 255, 0.9)" />
                            )}
                          </div>
                          {image.author.profileUrl !== '#' ? (
                            <a 
                              href={image.author.profileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="author-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {image.author.name}
                            </a>
                          ) : (
                            <span className="author-link">
                              {image.author.name}
                            </span>
                          )}
                        </div>
                        <div className="image-stats">
                          <span title="J'aime">
                            <BiHeart /> {formatNumber(image.stats.likes)}
                          </span>
                          <span title="Commentaires">
                            <BiComment /> {formatNumber(image.stats.comments)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {loading && <SkeletonGrid />}
            </>
          )}

          {selectedImage && (
            <ImageModal
              screenshot={selectedImage}
              onClose={() => setSelectedImage(null)}
              formatNumber={formatNumber}
            />
          )}
        </main>
      </div>
    </div>
  );
};