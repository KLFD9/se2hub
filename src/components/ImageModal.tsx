import React, { useEffect, useCallback, useState } from 'react';
import { BiX, BiUser, BiHeart, BiComment, BiExpand, BiCollapse } from 'react-icons/bi';
import { SteamScreenshot } from '../services/steamService';
import '../styles/components/ImageModal.css';

interface ImageModalProps {
  screenshot: SteamScreenshot;
  onClose: () => void;
  formatNumber: (num: number) => string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  screenshot, 
  onClose,
  formatNumber
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Gestion des touches clavier
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else {
        onClose();
      }
    } else if (e.key === 'f') {
      setIsFullscreen(!isFullscreen);
    }
  }, [onClose, isFullscreen]);

  // Gestion du plein écran
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Gestion des gestes tactiles
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeDown = distance < -100;
    
    if (isSwipeDown) {
      onClose();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const modalClasses = `modal-content ${isFullscreen ? 'fullscreen' : ''}`;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={modalClasses}
        onClick={handleContentClick}
      >
        <button 
          className="modal-close" 
          onClick={onClose}
          aria-label="Fermer"
        >
          <BiX size={24} />
        </button>

        <button 
          className="fullscreen-toggle" 
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
        >
          {isFullscreen ? <BiCollapse size={24} /> : <BiExpand size={24} />}
        </button>
        
        <div className="modal-image-container">
          <img 
            src={screenshot.url} 
            alt={screenshot.title}
            loading="eager"
            className={isFullscreen ? 'fullscreen' : ''}
          />
        </div>
        
        <div className="modal-info">
          <h2 id="modal-title">{screenshot.title}</h2>
          
          {screenshot.description && (
            <p className="modal-description">{screenshot.description}</p>
          )}
          
          <div className="modal-metadata">
            <div className="modal-author">
              <div className="author-avatar">
                <BiUser size={20} />
              </div>
              <a 
                href={screenshot.author.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="author-link"
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
            
            {screenshot.tags.length > 0 && (
              <div className="modal-tags">
                {screenshot.tags.map((tag, idx) => (
                  <span key={idx} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modal-shortcuts">
        <span>ESC pour fermer</span>
        <span>F pour le plein écran</span>
        <span>Glisser vers le bas pour fermer</span>
      </div>
    </div>
  );
}; 