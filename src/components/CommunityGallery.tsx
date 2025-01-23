import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BiTime, BiHeart, BiComment, BiShow, BiUser } from 'react-icons/bi';
import { steamService, SteamScreenshot } from '../services/steamService';
import '../styles/components/CommunityGallery.css';

interface FilterState {
  sort: 'popular' | 'newest' | 'trending';
  period: 'day' | 'week' | 'month' | 'all';
  tags: string;
}

const filters = {
  sort: [
    { value: 'popular', label: 'Les plus populaires' },
    { value: 'newest', label: 'Les plus récents' },
    { value: 'trending', label: 'Tendances' },
  ],
  period: [
    { value: 'day', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'all', label: 'Tout' },
  ],
};

export const CommunityGallery: React.FC = () => {
  const [images, setImages] = useState<SteamScreenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    sort: 'popular',
    period: 'all',
    tags: 'all',
  });

  const fetchImages = useCallback(async (pageNum: number, isNewFilter = false) => {
    try {
      setLoading(true);
      const newImages = await steamService.getScreenshots({
        page: pageNum,
        sort: activeFilters.sort,
        period: activeFilters.period,
      });

      setImages(prev => isNewFilter ? newImages : [...prev, ...newImages]);
      setHasMore(newImages.length > 0);
      setError(null);
    } catch (error) {
      console.error('Erreur lors du chargement des images:', error);
      setError('Impossible de charger les images. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  }, [activeFilters.sort, activeFilters.period]);

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
    setImages([]);
    fetchImages(1, true);
  }, [activeFilters, fetchImages]);

  useEffect(() => {
    if (page > 1) {
      fetchImages(page);
    }
  }, [page, fetchImages]);

  const handleFilterChange = (filterId: keyof FilterState, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterId]: value,
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="community-gallery">
      <aside className="gallery-filters">
        <div className="filters-header">
          <h2>Filtres</h2>
        </div>
        
        <div className="filter-group">
          <h3>Tri</h3>
          <select
            value={activeFilters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value as FilterState['sort'])}
            className="filter-select"
          >
            {filters.sort.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <h3>Période</h3>
          <select
            value={activeFilters.period}
            onChange={(e) => handleFilterChange('period', e.target.value as FilterState['period'])}
            className="filter-select"
          >
            {filters.period.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </aside>

      <main className="gallery-content">
        <div className="gallery-header">
          <h1>Galerie Communautaire</h1>
          <p>Découvrez les créations de la communauté Space Engineers</p>
        </div>

        {error ? (
          <div className="gallery-error">
            <p>{error}</p>
            <button onClick={() => fetchImages(1, true)}>Réessayer</button>
          </div>
        ) : (
          <div className="gallery-grid">
            {images.map((image, index) => (
              <div
                key={image.id}
                ref={index === images.length - 1 ? lastImageRef : undefined}
                className="gallery-item"
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
                    <div className="author">
                      <div className="author-avatar">
                        <BiUser size={16} />
                      </div>
                      <span>{image.author.name}</span>
                    </div>
                    <div className="image-stats">
                      <span title="J'aime">
                        <BiHeart /> {formatNumber(image.stats.likes)}
                      </span>
                      <span title="Commentaires">
                        <BiComment /> {formatNumber(image.stats.comments)}
                      </span>
                      <span title="Vues">
                        <BiShow /> {formatNumber(image.stats.views)}
                      </span>
                      <span title="Date">
                        <BiTime /> {formatDate(image.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="gallery-loading">
            <div className="loading-spinner" />
            <p>Chargement des images...</p>
          </div>
        )}
      </main>
    </div>
  );
}; 