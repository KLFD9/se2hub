import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { NodeJS } from 'node';
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
  const [hasMore, setHasMore] = useState<boolean>(true);
  
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadVideos = useCallback(async (pageToken: string = '', reset: boolean = false) => {
    if (quotaError || (!reset && !hasMore)) return;
    
    if (reset) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response: VideosResponse = await getSpaceEngineers2Videos(pageToken);
      
      setVideos(prev => reset ? response.videos : [...prev, ...response.videos]);
      setNextPageToken(response.nextPageToken);
      setHasMore(!!response.nextPageToken && response.videos.length > 0);
      setQuotaError(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        setQuotaError(true);
      }
      console.error('Error loading videos:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [quotaError, hasMore]);

  useEffect(() => {
    loadVideos();
    // Cleanup function to avoid memory leaks
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Infinite Scroll with debounce
  useEffect(() => {
    if (!hasMore || loadingMore || loading) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    
    observerRef.current = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting && nextPageToken) {
        // Add debounce to prevent multiple calls
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          loadVideos(nextPageToken);
        }, 500);
      }
    }, { threshold: 0.5 });
    
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearTimeout(timeoutId);
    };
  }, [nextPageToken, loadingMore, loading, hasMore, loadVideos]);

  // Fonction de rafraîchissement
  const handleRefresh = () => {
    loadVideos('', true);
  };

  return (
    <>
      <button 
        onClick={handleRefresh} 
        disabled={loading || loadingMore}
        style={{ margin: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
      >
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
        {videos.map((video, index) => (
          <YoutubeVideoCard key={`${video.id}-${index}`} video={video} />
        ))}
        
        {(loading || loadingMore) && [...Array(4)].map((_, index) => (
          <YoutubeVideoCardSkeleton key={`skeleton-${index}`} />
        ))}

        {!loading && !loadingMore && !hasMore && videos.length > 0 && (
          <div style={{ 
            gridColumn: '1/-1', 
            textAlign: 'center', 
            padding: '1rem',
            color: '#666' 
          }}>
            Fin des résultats
          </div>
        )}

        {hasMore && <div ref={sentinelRef} style={{ height: '1px' }}></div>}
      </div>
    </>
  );
};

export default YoutubeVideos;
