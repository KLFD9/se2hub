import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Video } from '../../types/Video';
import '../../styles/components/VideoPlayer.css';

interface VideoPlayerProps {
  video?: Video;
}

const formatSubscriberCount = (count?: string) => {
  if (!count) return '';
  const num = Number(count);
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M abonnés`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K abonnés`;
  return `${num} abonnés`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const { videoId } = useParams<{ videoId: string }>();
  const currentVideoId = video?.id || videoId;
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    setVideoError(false);
    setRetryCount(0);
  }, [currentVideoId]);

  if (!currentVideoId) {
    return (
      <div className="video-player-container error">
        <div className="error-message">Vidéo non trouvée</div>
      </div>
    );
  }

  const handleIframeError = () => {
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setVideoError(false);
      }, 1000 * (retryCount + 1));
    } else {
      setVideoError(true);
    }
  };

  const handleChannelClick = (channelId?: string) => {
    if (channelId) {
      window.open(`https://www.youtube.com/channel/${channelId}`, '_blank');
    }
  };

  if (videoError) {
    return (
      <div className="video-player-container error">
        <div className="error-message">
          Cette vidéo n'est pas disponible. Elle a peut-être été supprimée ou son accès est restreint.
          <button 
            onClick={() => {
              setVideoError(false);
              setRetryCount(0);
            }}
            className="retry-button"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <iframe
          key={`${currentVideoId}-${retryCount}`}
          src={`https://www.youtube.com/embed/${currentVideoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={handleIframeError}
        />
      </div>
      
      {video && (
        <div className="video-info">
          <div className="video-header">
            <h1 className="video-title">{video.title}</h1>
            
            <div className="video-meta-info">
              <div className="channel-info">
                {video.channelThumbnailUrl && (
                  <img 
                    src={video.channelThumbnailUrl} 
                    alt={`Chaîne ${video.channelTitle}`}
                    loading="lazy"
                    onClick={() => handleChannelClick(video.channelId)}
                    className="channel-thumbnail"
                  />
                )}
                <div className="channel-details">
                  <span 
                    className="channel-name"
                    onClick={() => handleChannelClick(video.channelId)}
                  >
                    {video.channelTitle}
                  </span>
                  {video.subscriberCount && (
                    <span className="subscriber-count">
                      {formatSubscriberCount(video.subscriberCount)}
                    </span>
                  )}
                </div>
              </div>

              <div className="video-stats">
                {video.viewCount && (
                  <span>{Number(video.viewCount).toLocaleString('fr-FR')} vues</span>
                )}
                {video.publishedAt && (
                  <span>Publié le {formatDate(video.publishedAt)}</span>
                )}
                {video.likeCount && (
                  <span>{Number(video.likeCount).toLocaleString('fr-FR')} likes</span>
                )}
              </div>
            </div>
          </div>

          {video.description && (
            <div className="video-description">
              {video.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(VideoPlayer);
