import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video } from '../../types/Video';
import { getSpaceEngineers2Videos } from '../../services/youtubeService';
import YoutubeVideoCard from './YoutubeVideoCard';
import YoutubeVideoCardSkeleton from './YoutubeVideoCardSkeleton';
import '../../styles/pages/Youtube.css';

const YoutubeVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchVideos = useCallback(async (pageToken = '', reset = false) => {
    try {
      if (reset) {
        console.debug('[YT Component] Initial load started');
        setIsInitialLoading(true);
        setVideos([]); // Clear existing videos on reset
      } else {
        console.debug(`[YT Component] Loading more: ${pageToken}`);
        setIsLoadingMore(true);
      }

      const response = await getSpaceEngineers2Videos(pageToken);
      
      if (!response?.videos) {
        console.debug('[YT Component] No videos in response');
        return;
      }

      console.debug(`[YT Component] Received ${response.videos.length} videos, nextToken: ${response.nextPageToken}`);

      setVideos(prev => {
        const combined = reset ? response.videos : [...prev, ...response.videos];
        return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      });

      setNextPageToken(response.nextPageToken);
      setIsQuotaError(false);

    } catch (error) {
      console.error('[YT Component Error]', error);
      setIsQuotaError(true);
    } finally {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && nextPageToken && !isLoadingMore) {
        console.debug('[YT Component] Triggering infinite scroll load');
        fetchVideos(nextPageToken);
      }
    }, { rootMargin: '400px' });

    const currentRef = sentinelRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
      observer.disconnect();
    };
  }, [nextPageToken, isLoadingMore, fetchVideos]);

  useEffect(() => {
    console.debug('[YT Component] Initial load triggered');
    fetchVideos('', true);
  }, [fetchVideos]);

  return (
    <>
      {isQuotaError && (
        <div className="quota-error">
          Le quota d'appels à l'API YouTube a été dépassé.
        </div>
      )}

      <div className="youtube-videos">
        {videos.map((video) => (
          <YoutubeVideoCard key={video.id} video={video} />
        ))}

        {(isInitialLoading || isLoadingMore) &&
          Array.from({ length: 4 }).map((_, index) => (
            <YoutubeVideoCardSkeleton key={`skeleton-${index}`} />
          ))}

        {!isInitialLoading && !isLoadingMore && !nextPageToken && videos.length > 0 && (
          <div className="end-of-results">
            Fin des résultats
          </div>
        )}

        <div ref={sentinelRef} className="sentinel" />
      </div>
    </>
  );
};

export default YoutubeVideos;