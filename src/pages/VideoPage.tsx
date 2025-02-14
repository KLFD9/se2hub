import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/youtube/VideoPlayer';
import RecommendedVideos from '../components/youtube/RecommendedVideos';
import { Video } from '../types/Video';
import { getSpaceEngineers2Videos } from '../services/youtubeService';
import '../styles/components/VideoPlayer.css';

type VideoState = {
  data: Video | null;
  recommendations: Video[];
  loading: boolean;
  error: string | null;
};

const VideoPage: React.FC = () => {
  const { videoId } = useParams();
  const [state, setState] = useState<VideoState>({
    data: null,
    recommendations: [],
    loading: true,
    error: null
  });

  const fetchVideoData = useCallback(async (abortSignal?: AbortSignal) => {
    if (!videoId) {
      setState(prev => ({ ...prev, error: "ID de vidéo manquant", loading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await getSpaceEngineers2Videos('', videoId);
      const currentVideo = response.videos.find(v => v.id === videoId);

      if (!currentVideo) {
        throw new Error('VIDEO_NOT_FOUND');
      }

      setState({
        data: currentVideo,
        recommendations: response.videos
          .filter(v => v.id !== videoId)
          .slice(0, 10),
        loading: false,
        error: null
      });

    } catch (error) {
      if (abortSignal?.aborted) return;
      
      const message = error instanceof Error 
        ? error.message === 'VIDEO_NOT_FOUND'
          ? "Cette vidéo n'est pas disponible"
          : "Erreur de chargement des données"
        : "Une erreur inconnue est survenue";

      setState(prev => ({
        ...prev,
        error: message,
        loading: false
      }));
    }
  }, [videoId]);

  useEffect(() => {
    const abortController = new AbortController();
    fetchVideoData(abortController.signal);

    return () => abortController.abort();
  }, [fetchVideoData]);

  const skeletonItems = useMemo(() => 
    Array.from({ length: 4 }, (_, i) => (
      <div key={`skeleton-${i}`} className="vp-skeleton">
        <div className="vp-skeleton-thumb" />
      </div>
    )), []);

  const errorContent = useMemo(() => (
    <div className="vp-page">
      <div className="vp-player-section">
        <div className="video-player-container error">
          <div className="error-message">
            {state.error}
            <button 
              onClick={() => fetchVideoData()}
              className="retry-button"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  ), [state.error, fetchVideoData]);

  if (state.error) {
    return errorContent;
  }

  return (
    <div className="vp-page">
      <div className="vp-player-section">
        {state.data && <VideoPlayer video={state.data} />}
        {state.loading && (
          <div className="video-player-container loading">
            <div className="loading-spinner" />
          </div>
        )}
      </div>

      <aside className="vp-sidebar">
        {state.loading ? (
          skeletonItems
        ) : (
          <RecommendedVideos 
            videos={state.recommendations} 
            currentVideoId={videoId}
          />
        )}
      </aside>
    </div>
  );
};

export default React.memo(VideoPage);