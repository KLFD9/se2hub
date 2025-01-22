import React from 'react';
import '../styles/components/SkeletonCard.css';

const SkeletonCard: React.FC<{ isFirst?: boolean }> = ({ isFirst }) => (
  <article className={`social-card skeleton-card ${isFirst ? 'first-card' : ''}`}>
    <div className="skeleton-thumbnail" />
    <div className="card-overlay">
      <div className="social-card-header">
        <div className="skeleton-icon" />
        <div className="skeleton-author" />
      </div>
      <div className="card-content">
        <div className="skeleton-text" />
        <div className="social-stats">
          <div className="skeleton-date" />
          <div className="skeleton-stat" />
          <div className="skeleton-stat" />
          <div className="skeleton-avatar" />
        </div>
      </div>
    </div>
  </article>
);

export default SkeletonCard; 