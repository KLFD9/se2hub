import React, { useState, useEffect, useCallback } from 'react';
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Générer un titre par défaut si aucun n'est fourni
  const displayTitle = screenshot.title || `Création de ${screenshot.author.name}`;

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

  const toggleZoom = useCallback(() => {
    setIsZoomed(prev => !prev);
    setShowControls(!isZoomed);
  }, [isZoomed]);

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
      case 'f':
        toggleFullscreen();
        break;
      case 'z':
        toggleZoom();
        break;
      case 'h':
        setShowControls(prev => !prev);
        break;
      case '?':
        setShowShortcuts(prev => !prev);
        break;
    }
  }, [onClose, toggleFullscreen, toggleZoom, isZoomed]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.touches[0].clientY;
    const diff = touchStart - currentTouch;

    if (diff > 100) {
      onClose();
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
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
        <button className="close-button" onClick={onClose} title="Fermer (Esc)">
          <BiX size={36} />
          <span className="tooltip">Fermer</span>
        </button>
        <div className="modal-actions">
          <button onClick={toggleFullscreen} title="Plein écran (F)">
            {isFullscreen ? <BiCollapse size={32} /> : <BiExpand size={32} />}
            <span className="tooltip">{isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}</span>
          </button>
          <button onClick={toggleZoom} title="Zoomer (Z)">
            {isZoomed ? <BiZoomOut size={32} /> : <BiZoomIn size={32} />}
            <span className="tooltip">{isZoomed ? 'Dé-zoomer' : 'Zoomer'}</span>
          </button>
          <button onClick={handleDownload} title="Télécharger l'image">
            <BiDownload size={32} />
            <span className="tooltip">Télécharger</span>
          </button>
          {canShare && (
            <button onClick={handleShare} title="Partager l'image">
              <BiShare size={32} />
              <span className="tooltip">Partager</span>
            </button>
          )}
        </div>
      </div>

      <div 
        className="modal-content" 
        onClick={toggleZoom}
      >
        <img 
          src={screenshot.url} 
          alt={displayTitle}
          className={isZoomed ? 'zoomed' : ''}
        />
      </div>

      <div className={`modal-info ${showControls ? '' : 'hidden'}`}>
        <h2>{displayTitle}</h2>
        {screenshot.description && <p className="modal-description">{screenshot.description}</p>}
        <div className="modal-author">
          <div className="author-avatar">
            <BiUser size={24} />
          </div>
          <a 
            href={screenshot.author.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {screenshot.author.name}
          </a>
        </div>
        <div className="modal-stats">
          <span title="J'aime">
            <BiHeart /> {formatNumber(screenshot.stats.likes)}
          </span>
          <span title="Commentaires">
            <BiComment /> {formatNumber(screenshot.stats.comments)}
          </span>
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
              <li><kbd>?</kbd> Afficher les raccourcis</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 