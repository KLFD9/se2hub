import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BiHeart, BiComment, BiShow, BiUser, BiSearch, BiX, BiReset } from 'react-icons/bi';
import { steamService, SteamScreenshot } from '../services/steamService';
import { ImageModal } from './ImageModal';
import '../styles/components/CommunityGallery.css';

interface FilterState {
  search: string;
  sort: 'trending' | 'popular' | 'newest';
  period: 'day' | 'month' | 'week' | 'all';
  tags: string[];
}

const SORT_OPTIONS = [
  { value: 'popular', label: 'Les plus populaires' },
  { value: 'newest', label: 'Les plus récents' },
  { value: 'trending', label: 'Tendances' },
] as const;

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Aujourd\'hui' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'all', label: 'Tout' },
] as const;

export const CommunityGallery: React.FC = () => {
  const [images, setImages] = useState<SteamScreenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<SteamScreenshot | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    search: '',
    sort: 'popular',
    period: 'all',
    tags: []
  });
  const [isFilterOpen] = useState(false);

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

  const handleFilterChange = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setActiveFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const resetFilters = () => {
    setActiveFilters({
      search: '',
      sort: 'popular',
      period: 'all',
      tags: []
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

  const filteredImages = React.useMemo(() => {
    return images.filter(image => {
      const matchesSearch = image.title.toLowerCase().includes(activeFilters.search.toLowerCase());
      const matchesTags = activeFilters.tags.length === 0 || 
        activeFilters.tags.every(tag => image.tags.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [images, activeFilters.search, activeFilters.tags]);

  return (
    <div className="community-gallery">
      <aside className={`gallery-filters ${isFilterOpen ? 'open' : ''}`}>
        <div className="filters-header">
          <div className="filters-header-top">
            <h2>Filtres</h2>
            <button 
              className="reset-filters"
              onClick={resetFilters}
              title="Réinitialiser les filtres"
            >
              <BiReset />
              Réinitialiser
            </button>
          </div>
        </div>

        {activeFilters.tags.length > 0 && (
          <div className="active-filters">
            {activeFilters.tags.map(tag => (
              <span key={tag} className="active-filter">
                {tag}
                <button onClick={() => handleTagToggle(tag)}>
                  <BiX size={16} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="filter-search">
          <BiSearch />
          <input
            type="text"
            placeholder="Rechercher..."
            value={activeFilters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <h3>
            Trier par
            <span className="filter-count">1</span>
          </h3>
          <select
            className="filter-select"
            value={activeFilters.sort}
            onChange={e => handleFilterChange('sort', e.target.value as FilterState['sort'])}
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <h3>
            Période
            <span className="filter-count">1</span>
          </h3>
          <select
            className="filter-select"
            value={activeFilters.period}
            onChange={e => handleFilterChange('period', e.target.value as FilterState['period'])}
          >
            {PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <h3>
            Tags populaires
            <span className="filter-count">{activeFilters.tags.length}</span>
          </h3>
          <div className="filter-tags">
            {['Combat', 'Exploration', 'Construction', 'Multijoueur', 'Mods'].map(tag => (
              <button
                key={tag}
                className={`filter-tag ${activeFilters.tags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="gallery-container">
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
                          <BiUser size={16} />
                        </div>
                        <a 
                          href={image.author.profileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="author-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {image.author.name}
                        </a>
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