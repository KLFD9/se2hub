import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/youtube/VideoPlayer';
import RecommendedVideos from '../components/youtube/RecommendedVideos';
import { Video } from '../types/Video';
import { getSpaceEngineers2Videos } from '../services/youtubeService';
import '../styles/components/VideoPlayer.css';

const VideoPage: React.FC = () => {
  const { videoId } = useParams();
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideos = async (forceRefresh: boolean = false) => {
      if (!videoId) {
        setError("ID de vidéo manquant");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Premier essai avec le cache
        let response = await getSpaceEngineers2Videos('', videoId);
        let current = response.videos.find((v) => v.id === videoId);

        // Si la vidéo n'est pas trouvée et qu'on n'a pas encore forcé le rafraîchissement
        if (!current && !forceRefresh) {
          console.log("Vidéo non trouvée dans le cache, tentative de récupération depuis l'API...");
          // Réessayer en forçant un rafraîchissement depuis l'API
          response = await getSpaceEngineers2Videos('', videoId);
          current = response.videos.find((v) => v.id === videoId);
        }

        if (!current) {
          setError("Cette vidéo n'est pas disponible");
          setCurrentVideo(null);
        } else {
          setCurrentVideo(current);
          // Mettre à jour les recommandations
          const filteredVideos = response.videos
            .filter((v) => v.id !== videoId)
            .slice(0, 10);
          setRecommendedVideos(filteredVideos);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des vidéos :', error);
        if (!forceRefresh) {
          // Si c'était le premier essai, réessayer avec forceRefresh
          console.log("Tentative de rechargement forcé...");
          await loadVideos(true);
        } else {
          setError("Une erreur est survenue lors du chargement de la vidéo");
        }
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [videoId]);

  if (error) {
    return (
      <div className="vp-page">
        <div className="vp-player-section">
          <div className="video-player-container error">
            <div className="error-message">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vp-page">
      <div className="vp-player-section">
        {currentVideo && <VideoPlayer video={currentVideo} />}
      </div>

      <aside className="vp-sidebar">
        {loading ? (
          Array(4).fill(null).map((_, index) => (
            <div key={index} className="vp-skeleton">
              <div className="vp-skeleton-thumb"></div>
            </div>
          ))
        ) : (
          recommendedVideos.length > 0 && <RecommendedVideos videos={recommendedVideos} />
        )}
      </aside>
    </div>
  );
};

export default VideoPage;
