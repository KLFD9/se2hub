import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BiComment, BiUser, BiSearch } from 'react-icons/bi';
import { BsHeartFill, BsHeart } from 'react-icons/bs';
import { steamService, SteamScreenshot } from '../services/steamService';
import { incrementImageLikes } from '../services/socialMedia';
import { ImageModal } from './ImageModal';
import '../styles/components/CommunityGallery.css';

const SkeletonLoader = () => (
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
  const [showLikedOnly, setShowLikedOnly] = useState(false);

  // État persistant des images votées
  const [likedImages, setLikedImages] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('likedImages');
    return saved ? JSON.parse(saved) : {};
  });
  // Référence pour verrouiller les clics rapides sur une image
  const voteLock = useRef<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem('likedImages', JSON.stringify(likedImages));
  }, [likedImages]);

  const handleToggleLike = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (voteLock.current[imageId]) return; // Si déjà en cours, ne rien faire
    voteLock.current[imageId] = true;

    const imageIndex = images.findIndex(image => image.id === imageId);
    if (imageIndex === -1) {
      voteLock.current[imageId] = false;
      return;
    }
    const updatedImages = [...images];

    if (!likedImages[imageId]) {
      // Vote non appliqué : on vote
      updatedImages[imageIndex] = {
        ...updatedImages[imageIndex],
        stats: {
          ...updatedImages[imageIndex].stats,
          likes: (updatedImages[imageIndex].stats.likes || 0) + 1,
        },
      };
      setImages(updatedImages);
      setLikedImages(prev => ({ ...prev, [imageId]: true }));

      try {
        await incrementImageLikes(imageId);
      } catch (error: any) {
        // En cas d'erreur autre que 404, on annule le vote
        if (!(error.response && error.response.status === 404)) {
          setLikedImages(prev => {
            const newState = { ...prev };
            delete newState[imageId];
            return newState;
          });
          updatedImages[imageIndex] = {
            ...updatedImages[imageIndex],
            stats: {
              ...updatedImages[imageIndex].stats,
              likes: updatedImages[imageIndex].stats.likes - 1,
            },
          };
          setImages(updatedImages);
        }
        // Sinon (404), on ignore l'erreur en mode optimiste
      }
    } else {
      // Vote déjà appliqué : on annule le vote (toggle off)
      updatedImages[imageIndex] = {
        ...updatedImages[imageIndex],
        stats: {
          ...updatedImages[imageIndex].stats,
          likes: updatedImages[imageIndex].stats.likes - 1,
        },
      };
      setImages(updatedImages);
      setLikedImages(prev => {
        const newState = { ...prev };
        delete newState[imageId];
        return newState;
      });
      // Pas d'appel à l'API pour décrémenter afin d'éviter le 404
    }
    voteLock.current[imageId] = false;
  };

  const fetchImages = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      const newImages = await steamService.getScreenshots({ page: pageNum });
      setImages(prev => (pageNum === 1 ? newImages : [...prev, ...newImages]));
      setHasMore(newImages.length > 0);
      setError(null);
    } catch (error) {
      setError("Impossible de charger les images. Veuillez réessayer plus tard.");
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
    if (page > 1) fetchImages(page);
  }, [page, fetchImages]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const filteredImages = React.useMemo(() => {
    const base = images.filter(image =>
      image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return showLikedOnly ? base.filter(image => likedImages[image.id]) : base;
  }, [images, searchQuery, showLikedOnly, likedImages]);

  return (
    <div className="community-gallery">
      <div className="gallery-container">
        <main className="gallery-content">
          <div className="gallery-header">
            <div className="header-left">
              <h1>
                <span className="gradient-text" data-text="Galerie">Galerie</span>
                <span className="subtitle">Communautaire</span>
              </h1>
            </div>
            <div className="header-right">
              <div className="header-controls">
                <button
                  className={`toggle-liked-button ${showLikedOnly ? 'active' : ''}`}
                  onClick={() => setShowLikedOnly(prev => !prev)}
                >
                  <BsHeartFill className="filter-icon" />
                  {showLikedOnly ? "Toutes les images" : "Images likées"}
                </button>
                <div className="search-container">
                  <div className="search-bar">
                    <input
                      type="text"
                      placeholder="Rechercher des vaisseaux, stations, bases..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    <BiSearch className="search-icon" />
                  </div>
                </div>
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
                      <img 
                        src={image.url} 
                        alt={`${image.title} - Construction spatiale par ${image.author.name}`} 
                        loading="lazy" 
                      />
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
                                alt={`Photo de profil de ${image.author.name}`}
                                onError={e => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  const parent = img.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<BiUser size={16} color="rgba(255, 255, 255, 0.9)" />';
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
                              onClick={e => e.stopPropagation()}
                            >
                              {image.author.name}
                            </a>
                          ) : (
                            <span className="author-link">{image.author.name}</span>
                          )}
                        </div>
                        <div className="image-stats">
                          <div className="analytics-stats">
                            <span title="J'aime" className={likedImages[image.id] ? 'liked' : ''}>
                              <BsHeartFill /> {formatNumber(image.stats.likes)}
                            </span>
                            <span title="Commentaires">
                              <BiComment /> {formatNumber(image.stats.comments)}
                            </span>
                          </div>
                          <div className="vote-button-container">
                            <button
                              className={`vote-button ${likedImages[image.id] ? 'voted' : ''}`}
                              onClick={e => handleToggleLike(image.id, e)}
                              title={likedImages[image.id] ? "Retirer mon like" : "J'aime"}
                              disabled={!!voteLock.current[image.id]}
                            >
                              {likedImages[image.id] ? <BsHeartFill /> : <BsHeart />}
                            </button>
                          </div>
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
