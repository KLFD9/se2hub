import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video } from '../../types/Video';
import { getSpaceEngineers2Videos, VideosResponse } from '../../services/youtubeService';
import YoutubeVideoCard from './YoutubeVideoCard';
import YoutubeVideoCardSkeleton from './YoutubeVideoCardSkeleton';
import '../../styles/pages/Youtube.css';

const YoutubeVideos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [lastFetchedToken, setLastFetchedToken] = useState<string | null>(null);

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchVideos = useCallback(
    async (pageToken: string = '', reset = false) => {
      if (isQuotaError || (!reset && !hasMore)) return;

      if (reset) {
        setIsInitialLoading(true);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response: VideosResponse = await getSpaceEngineers2Videos(pageToken);

        setVideos((prev) => {
          const combined = reset ? response.videos : [...prev, ...response.videos];
          const unique = combined.filter(
            (video, index, self) => self.findIndex((v) => v.id === video.id) === index
          );
          return unique;
        });

        setNextPageToken(response.nextPageToken);

        const canContinue = !!response.nextPageToken && response.videos.length > 0;
        if (response.nextPageToken && response.nextPageToken === lastFetchedToken) {
          setHasMore(false);
        } else {
          setHasMore(canContinue);
          setLastFetchedToken(response.nextPageToken || null);
        }

        setIsQuotaError(false);
      } catch {
        setIsQuotaError(true);
        setHasMore(false);
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isQuotaError, hasMore, lastFetchedToken]
  );

  useEffect(() => {
    fetchVideos('', true);
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchVideos]);

  useEffect(() => {
    if (!hasMore || isLoadingMore || isInitialLoading) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && nextPageToken) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            fetchVideos(nextPageToken);
          }, 500);
        }
      },
      { threshold: 0.5 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearTimeout(timeoutId);
    };
  }, [nextPageToken, isLoadingMore, isInitialLoading, hasMore, fetchVideos]);

  return (
    <>
      {isQuotaError && (
        <div
          style={{
            padding: '1rem',
            margin: '1rem',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          Le quota d'appels à l'API YouTube a été dépassé. Veuillez réessayer plus tard ou contacter l'administrateur.
        </div>
      )}

      <div className="youtube-videos">
        {videos.map((video, index) => (
          <YoutubeVideoCard key={`${video.id}-${index}`} video={video} />
        ))}

        {(isInitialLoading || isLoadingMore) &&
          Array.from({ length: 4 }).map((_, index) => (
            <YoutubeVideoCardSkeleton key={`skeleton-${index}`} />
          ))}

        {!isInitialLoading && !isLoadingMore && !hasMore && videos.length > 0 && (
          <div
            style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: '1rem',
              color: '#666',
            }}
          >
            Fin des résultats
          </div>
        )}

        {hasMore && <div ref={sentinelRef} style={{ height: '1px' }} />}
      </div>
    </>
  );
};

export default YoutubeVideos;
