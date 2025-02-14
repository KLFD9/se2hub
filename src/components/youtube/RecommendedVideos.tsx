import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../types/Video';
import '../../styles/components/RecommendedVideos.css';

interface RecommendedVideosProps {
  videos: Video[];
}

const RecommendedVideos: React.FC<RecommendedVideosProps> = ({ videos }) => {
  const handleChannelClick = (channelId?: string) => {
    if (channelId) {
      window.open(`https://www.youtube.com/channel/${channelId}`, '_blank');
    }
  };

  return (
    <div className="rv-container">
      <h2 className="rv-header">Vidéos recommandées</h2>
      <div className="rv-list">
        {videos.map((video) => (
          <div key={video.id}>
            <Link to={`/video/${video.id}`} className="rv-item">
              <div className="rv-thumbnail">
                <img src={video.thumbnailUrl} alt={video.title} />
                {video.duration && (
                  <span className="rv-duration">{video.duration}</span>
                )}
              </div>
              <div className="rv-info">
                <h3 className="rv-info-title">{video.title}</h3>
                <p 
                  className="rv-info-channel"
                  onClick={(e) => {
                    e.preventDefault();
                    handleChannelClick(video.channelId);
                  }}
                >
                  {video.channelTitle}
                </p>
                {video.viewCount && (
                  <p className="rv-info-views">
                    {Number(video.viewCount).toLocaleString()} vues
                  </p>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedVideos;
