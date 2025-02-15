// src/components/youtube/YoutubeVideoCard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video } from '../../types/Video';
import '../../styles/pages/Youtube.css';

interface YoutubeVideoCardProps {
  video: Video;
  compact?: boolean;
}

function formatViewCount(viewCount?: string): string {
  if (!viewCount) return '';
  const count = Number(viewCount);
  if (count >= 1e6) {
    return (count / 1e6).toFixed(1).replace(/\.0$/, '') + ' M vues';
  } else if (count >= 1e3) {
    return (count / 1e3).toFixed(1).replace(/\.0$/, '') + ' K vues';
  } else {
    return count + ' vues';
  }
}

function timeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `il y a ${interval} an${interval > 1 ? "s" : ""}`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `il y a ${interval} mois`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `il y a ${interval} jour${interval > 1 ? "s" : ""}`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `il y a ${interval} heure${interval > 1 ? "s" : ""}`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `il y a ${interval} minute${interval > 1 ? "s" : ""}`;
  return `il y a quelques secondes`;
}

const YoutubeVideoCard: React.FC<YoutubeVideoCardProps> = ({ video, compact = false }) => {
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  
  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
  const defaultThumbnail = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23333'/%3E%3C/svg%3E";

  const avatarSrc = avatarError || !video?.channelThumbnailUrl ? defaultAvatar : video.channelThumbnailUrl;
  const thumbnailSrc = thumbnailError || !video?.thumbnailUrl ? defaultThumbnail : video.thumbnailUrl;

  const handleAvatarError = () => {
    if (!avatarError) {
      setAvatarError(true);
    }
  };

  const handleThumbnailError = () => {
    if (!thumbnailError) {
      setThumbnailError(true);
    }
  };

  const handleCardClick = () => {
    if (video?.id) {
      navigate(`/video/${video.id}`);
    }
  };

  if (!video) return null;

  return (
    <div 
      className={`youtube-video-card ${compact ? 'compact' : ''}`} 
      onClick={handleCardClick} 
      style={{cursor: 'pointer'}}
    >
      <div className="card-thumbnail-container">
        <img 
          className="card-thumbnail" 
          src={thumbnailSrc} 
          alt={`Miniature de la vidéo : ${video.title}`} 
          onError={handleThumbnailError}
          loading="lazy" 
          style={{ display: 'block' }}
        />
        <span className="card-duration">{video.duration || '00:00'}</span>
      </div>
      <div className="card-info">
        {!compact && (
          <img 
            className="channel-avatar" 
            src={avatarSrc}
            alt={`Logo de la chaîne ${video.channelTitle}`} 
            onError={handleAvatarError}
            loading="lazy"
          />
        )}
        <div className="video-details">
          <h3 className="video-card-title" title={video.title || ''}>{video.title || 'Sans titre'}</h3>
          <div className="card-meta">
            <span className="channel-title">{video.channelTitle || 'Chaîne inconnue'}</span>
            <span className="video-stats">
              {formatViewCount(video.viewCount)} · {timeAgo(video.publishedAt || new Date().toISOString())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeVideoCard;
