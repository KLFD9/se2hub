import React, { useState, useRef, useEffect } from 'react';
import { YouTubeVideo } from '../services/youtubeService';
import VideoModal from './VideoModal';
import { 
    FaPlay, 
    FaChevronLeft, 
    FaChevronRight, 
    FaTools, 
    FaUserAstronaut, 
    FaNewspaper, 
    FaStar, 
    FaSpaceShuttle, 
    FaChartBar 
} from 'react-icons/fa';
import '../styles/components/VideoGrid.css';
import { createPortal } from 'react-dom';

interface VideoRowProps {
    title: string;
    videos: YouTubeVideo[];
    icon: React.ReactNode;
}

const VideoRow: React.FC<VideoRowProps> = ({ title, videos, icon }) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollButtons = () => {
        if (!rowRef.current) return;
        
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const element = rowRef.current;
        if (!element) return;

        // Options pour les événements avec passive: true
        const options = { passive: true };

        // Gestionnaires d'événements
        const handleScroll = () => {
            requestAnimationFrame(checkScrollButtons);
        };

        const handleResize = () => {
            requestAnimationFrame(checkScrollButtons);
        };

        // Ajout des écouteurs d'événements avec les options
        element.addEventListener('scroll', handleScroll, options);
        element.addEventListener('touchstart', handleScroll, options);
        element.addEventListener('touchmove', handleScroll, options);
        window.addEventListener('resize', handleResize, options);

        // Vérification initiale
        checkScrollButtons();

        // Nettoyage
        return () => {
            element.removeEventListener('scroll', handleScroll);
            element.removeEventListener('touchstart', handleScroll);
            element.removeEventListener('touchmove', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (!rowRef.current) return;
        
        const { clientWidth } = rowRef.current;
        const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
        
        rowRef.current.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });

        // Utiliser requestAnimationFrame pour la vérification après le défilement
        requestAnimationFrame(() => {
            setTimeout(checkScrollButtons, 300);
        });
    };

    return (
        <div className="video-row">
            <div className="video-row-header">
                <h3 className="row-title">
                    {icon}
                    {title}
                </h3>
            </div>
            <div className="video-slider">
                {canScrollLeft && (
                    <button 
                        className="slider-button prev" 
                        onClick={() => scroll('left')}
                        aria-label="Précédent"
                    >
                        <FaChevronLeft />
                    </button>
                )}
                <div 
                    className="video-grid" 
                    ref={rowRef}
                >
                    {videos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                    ))}
                </div>
                {canScrollRight && (
                    <button 
                        className="slider-button next" 
                        onClick={() => scroll('right')}
                        aria-label="Suivant"
                    >
                        <FaChevronRight />
                    </button>
                )}
            </div>
        </div>
    );
};

interface VideoCardProps {
    video: YouTubeVideo;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const formatViews = (views: number = 0) => {
        if (views >= 1000000) {
            return `${(views / 1000000).toFixed(1)}M vues`;
        }
        if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}K vues`;
        }
        return `${views} vues`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowModal(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseModal = () => {
        setShowModal(false);
        document.body.style.overflow = 'auto';
    };

    return (
        <>
            <div 
                className="video-card"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleClick}
            >
                <div className="thumbnail-container">
                    <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        loading="lazy"
                    />
                    {isHovered && (
                        <div className="hover-info">
                            <h3>{video.title}</h3>
                            <p className="channel-title">{video.channelTitle}</p>
                            <div className="video-stats">
                                <span>{formatViews(video.viewCount)}</span>
                                <span>•</span>
                                <span>{formatDate(video.publishedAt)}</span>
                            </div>
                            <p className="video-description">
                                {video.description.length > 120 
                                    ? `${video.description.substring(0, 120)}...` 
                                    : video.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            {showModal && createPortal(
                <div className="video-modal-overlay" onClick={handleCloseModal}>
                    <div className="video-modal-content" onClick={e => e.stopPropagation()}>
                        <VideoModal
                            videoId={video.id}
                            onClose={handleCloseModal}
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

interface VideoGridProps {
    videos: YouTubeVideo[];
}

const FeaturedHeader: React.FC<{ video: YouTubeVideo }> = ({ video }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <header className="featured-header">
            <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="featured-background"
            />
            <div className="featured-overlay" />
            <div className="featured-content">
                <h1 className="featured-title">{video.title}</h1>
                <p className="featured-description">
                    {video.description.length > 200 
                        ? `${video.description.substring(0, 200)}...` 
                        : video.description}
                </p>
                <div className="featured-buttons">
                    <button 
                        className="featured-button primary"
                        onClick={() => setShowModal(true)}
                    >
                        <FaPlay /> Lecture
                    </button>
                </div>
            </div>
            {showModal && (
                <VideoModal
                    videoId={video.id}
                    onClose={() => setShowModal(false)}
                />
            )}
        </header>
    );
};

const VideoGrid: React.FC<VideoGridProps> = ({ videos }) => {
    // Sélectionner la vidéo la plus populaire pour la mise en avant
    const featuredVideo = videos.reduce((prev, current) => 
        (current.viewCount || 0) > (prev.viewCount || 0) ? current : prev
    , videos[0]);

    // Catégorisation améliorée des vidéos
    const categorizeVideos = () => {
        const categories = {
            tutorials: videos.filter(v => 
                v.title.toLowerCase().includes('tutorial') || 
                v.title.toLowerCase().includes('guide') ||
                v.title.toLowerCase().includes('how to')
            ),
            gameplay: videos.filter(v => 
                v.title.toLowerCase().includes('gameplay') || 
                v.title.toLowerCase().includes('let\'s play') ||
                v.title.toLowerCase().includes('playthrough')
            ),
            builds: videos.filter(v => 
                v.title.toLowerCase().includes('build') || 
                v.title.toLowerCase().includes('creation') ||
                v.title.toLowerCase().includes('design')
            ),
            news: videos.filter(v => 
                v.title.toLowerCase().includes('news') || 
                v.title.toLowerCase().includes('update') ||
                v.title.toLowerCase().includes('patch') ||
                v.publishedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            ),
            reviews: videos.filter(v => 
                v.title.toLowerCase().includes('review') || 
                v.title.toLowerCase().includes('analysis') ||
                v.title.toLowerCase().includes('opinion')
            ),
            highlights: videos.filter(v => 
                (v.viewCount || 0) > 10000 || 
                (v.likeCount || 0) > 1000
            ),
        };

        // Trier chaque catégorie par date de publication
        Object.keys(categories).forEach(key => {
            categories[key as keyof typeof categories].sort((a, b) => 
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );
        });

        return categories;
    };

    const categories = categorizeVideos();

    return (
        <div className="video-grid-container">
            {featuredVideo && <FeaturedHeader video={featuredVideo} />}
            
            <section className="content-section">
                {categories.news.length > 0 && (
                    <VideoRow 
                        title="Actualités & Mises à jour" 
                        videos={categories.news}
                        icon={<FaNewspaper className="icon" />}
                    />
                )}
                
                {categories.highlights.length > 0 && (
                    <VideoRow 
                        title="Vidéos Populaires" 
                        videos={categories.highlights}
                        icon={<FaStar className="icon" />}
                    />
                )}
                
                {categories.tutorials.length > 0 && (
                    <VideoRow 
                        title="Tutoriels & Guides" 
                        videos={categories.tutorials}
                        icon={<FaTools className="icon" />}
                    />
                )}
                
                {categories.gameplay.length > 0 && (
                    <VideoRow 
                        title="Gameplay" 
                        videos={categories.gameplay}
                        icon={<FaUserAstronaut className="icon" />}
                    />
                )}
                
                {categories.builds.length > 0 && (
                    <VideoRow 
                        title="Constructions & Créations" 
                        videos={categories.builds}
                        icon={<FaSpaceShuttle className="icon" />}
                    />
                )}

                {categories.reviews.length > 0 && (
                    <VideoRow 
                        title="Critiques & Analyses" 
                        videos={categories.reviews}
                        icon={<FaChartBar className="icon" />}
                    />
                )}
            </section>
        </div>
    );
};

export default VideoGrid; 