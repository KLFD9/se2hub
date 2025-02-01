import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BiX, BiUser, BiHeart, BiComment, BiExpand, BiCollapse, BiDownload, BiShare, BiZoomIn, BiZoomOut } from 'react-icons/bi';
import { SteamScreenshot } from '../services/steamService';
import '../styles/components/ImageModal.css';

interface ImageModalProps {
  screenshot: SteamScreenshot;
  onClose: () => void;
  formatNumber: (num: number) => string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ screenshot, onClose, formatNumber }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const displayTitle = screenshot.title || `Création de ${screenshot.author.name}`;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setCanShare('share' in navigator && typeof navigator.share === 'function');
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const toggleZoom = useCallback((clientX?: number, clientY?: number) => {
    setIsZoomed(prev => {
      if (!prev && imageRef.current && clientX && clientY) {
        const rect = imageRef.current.getBoundingClientRect();
        const zoomFactor = 2;
        imageRef.current.style.transformOrigin = `${((clientX - rect.left) / rect.width) * 100}% ${((clientY - rect.top) / rect.height) * 100}%`;
        imageRef.current.style.transform = `scale(${zoomFactor})`;
      } else {
        imageRef.current?.style.removeProperty('transform');
      }
      return !prev;
    });
    setShowControls(prev => !prev);
  }, []);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        if (isZoomed) {
          setIsZoomed(false);
          setShowControls(true);
        } else if (document.fullscreenElement) {
          document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          onClose();
        }
        break;
      case 'f': toggleFullscreen(); break;
      case 'z': toggleZoom(); break;
      case 'h': setShowControls(prev => !prev); break;
      case '?': setShowShortcuts(prev => !prev); break;
    }
  }, [onClose, toggleFullscreen, toggleZoom, isZoomed]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length > 1) return;
    
    const deltaY = touchStartRef.current.y - e.touches[0].clientY;
    if (Math.abs(deltaY) > 100) {
      onClose();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const { clientX, clientY } = e.changedTouches[0];
    const deltaTime = Date.now() - touchStartRef.current.time;
    const movedDistance = Math.hypot(
      clientX - touchStartRef.current.x,
      clientY - touchStartRef.current.y
    );

    if (deltaTime < 300 && movedDistance < 10) {
      toggleZoom(clientX, clientY);
    }
    
    touchStartRef.current = null;
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: screenshot.title,
        text: `Découvrez "${screenshot.title}" sur Space Engineers`,
        url: screenshot.url
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(screenshot.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${screenshot.title}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div 
      className={`image-modal ${isFullscreen ? 'fullscreen' : ''} ${isZoomed ? 'zoomed' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`modal-controls ${showControls ? '' : 'hidden'}`}>
        <button className="close-button" onClick={onClose} aria-label="Fermer">
          <BiX size={isMobile ? 28 : 36} />
          <span className="tooltip">Fermer (Esc)</span>
        </button>
        <div className="modal-actions">
          <button onClick={toggleFullscreen} aria-label="Plein écran">
            {isFullscreen ? <BiCollapse size={isMobile ? 24 : 32} /> : <BiExpand size={isMobile ? 24 : 32} />}
            <span className="tooltip">{isFullscreen ? 'Quitter plein écran' : 'Plein écran (F)'}</span>
          </button>
          <button onClick={() => toggleZoom()} aria-label="Zoom">
            {isZoomed ? <BiZoomOut size={isMobile ? 24 : 32} /> : <BiZoomIn size={isMobile ? 24 : 32} />}
            <span className="tooltip">{isZoomed ? 'Dé-zoomer (Z)' : 'Zoomer (Z)'}</span>
          </button>
          <button onClick={handleDownload} aria-label="Télécharger">
            <BiDownload size={isMobile ? 24 : 32} />
            <span className="tooltip">Télécharger</span>
          </button>
          {canShare && (
            <button onClick={handleShare} aria-label="Partager">
              <BiShare size={isMobile ? 24 : 32} />
              <span className="tooltip">Partager</span>
            </button>
          )}
        </div>
      </div>

      <div className="modal-content">
        <img 
          ref={imageRef}
          src={screenshot.url} 
          alt={displayTitle}
          className={isZoomed ? 'zoomed' : ''}
          loading="lazy"
        />
      </div>

      <div className={`modal-info ${showControls ? '' : 'hidden'}`}>
        <div className="info-content">
          <h2>{displayTitle}</h2>
          {screenshot.description && <p className="modal-description">{screenshot.description}</p>}
          <div className="metadata-container">
            <div className="modal-author">
              <div className="author-avatar">
                {screenshot.author.avatarUrl ? (
                  <img 
                    src={screenshot.author.avatarUrl} 
                    alt={`Avatar de ${screenshot.author.name}`}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      img.parentElement?.querySelector('svg')?.classList.remove('hidden');
                    }}
                  />
                ) : (
                  <BiUser size={20} />
                )}
                <BiUser className="hidden" size={20} />
              </div>
              <div className="author-info">
                {screenshot.author.profileUrl !== '#' ? (
                  <a 
                    href={screenshot.author.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="author-link"
                  >
                    {screenshot.author.name}
                  </a>
                ) : (
                  <span className="author-link">
                    {screenshot.author.name}
                  </span>
                )}
                <div className="modal-stats">
                  <span><BiHeart /> {formatNumber(screenshot.stats.likes)}</span>
                  <span><BiComment /> {formatNumber(screenshot.stats.comments)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShortcuts && (
        <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-panel" onClick={e => e.stopPropagation()}>
            <h3>Raccourcis clavier</h3>
            <ul>
              <li><kbd>Esc</kbd> Fermer</li>
              <li><kbd>F</kbd> Plein écran</li>
              <li><kbd>Z</kbd> Zoomer</li>
              <li><kbd>H</kbd> Afficher/Masquer les contrôles</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};