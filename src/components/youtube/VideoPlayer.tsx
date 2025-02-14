import React, { memo } from 'react';
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

  if (!currentVideoId) {
    return <div className="video-player-container">Vidéo non trouvée</div>;
  }

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <iframe
          src={`https://www.youtube.com/embed/${currentVideoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
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
                  />
                )}
                <div className="channel-details">
                  <span className="channel-name">{video.channelTitle}</span>
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
