import React from 'react';
import '../../styles/pages/Youtube.css';

const YoutubeVideoCardSkeleton: React.FC = () => {
  return (
    <div className="youtube-video-card skeleton-card">
      <div className="card-thumbnail-container">
        <div className="skeleton skeleton-thumbnail" />
        <div className="card-duration skeleton skeleton-duration" />
      </div>
      <div className="card-info">
        <div className="skeleton skeleton-avatar" />
        <div className="video-details">
          <div className="skeleton skeleton-title" />
          <div className="card-meta">
            <div className="skeleton skeleton-channel" />
            <div className="skeleton skeleton-stats" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubeVideoCardSkeleton; 