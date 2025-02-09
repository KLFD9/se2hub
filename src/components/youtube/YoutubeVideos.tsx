// src/components/youtube/YoutubeVideos.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video } from '../../types/Video';
import { getSpaceEngineers2Videos, VideosResponse } from '../../services/youtubeService';
import YoutubeVideoCard from './YoutubeVideoCard';
import YoutubeVideoCardSkeleton from './YoutubeVideoCardSkeleton';
import '../../styles/pages/Youtube.css';

const YoutubeVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [quotaError, setQuotaError] = useState<boolean>(false);
  
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Chargement initial
  const loadVideos = useCallback(async (pageToken: string = '', reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const response: VideosResponse = await getSpaceEngineers2Videos(pageToken);
      setVideos(prev => reset ? response.videos : [...prev, ...response.videos]);
      setNextPageToken(response.nextPageToken);
      setQuotaError(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        setQuotaError(true);
      }
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting && nextPageToken && !loadingMore) {
        loadVideos(nextPageToken);
      }
    }, { threshold: 0.5 });
    
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    
    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [nextPageToken, loadingMore, loadVideos]);

  // Fonction de rafraîchissement
  const handleRefresh = () => {
    loadVideos('', true);
  };

  return (
    <>
      <button onClick={handleRefresh} style={{ margin: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
        Rafraîchir
      </button>
      {quotaError && (
        <div style={{ 
          padding: '1rem', 
          margin: '1rem', 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          borderRadius: '4px',
          textAlign: 'center' 
        }}>
          Le quota d'appels à l'API YouTube a été dépassé. Veuillez réessayer plus tard ou contacter l'administrateur.
        </div>
      )}
      <div className="youtube-videos">
        {videos.map(video => (
          <YoutubeVideoCard key={video.id} video={video} />
        ))}
        {(loading || loadingMore) && [...Array(8)].map((_, index) => (
          <YoutubeVideoCardSkeleton key={`skeleton-${index}`} />
        ))}
        {/* Élément sentinel pour déclencher l'infinite scroll */}
        <div ref={sentinelRef} style={{ height: '1px' }}></div>
      </div>
    </>
  );
};

export default YoutubeVideos;
