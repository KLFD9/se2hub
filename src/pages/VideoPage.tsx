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

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        const response = await getSpaceEngineers2Videos();
        // Filtrer la vidéo actuelle
        const filteredVideos = response.videos.filter((v) => v.id !== videoId);
        setRecommendedVideos(filteredVideos.slice(0, 10));

        // Trouver la vidéo actuelle
        const current = response.videos.find((v) => v.id === videoId);
        if (current) {
          setCurrentVideo(current);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des vidéos :', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [videoId]);

  return (
    <div className="vp-page">
      <div className="vp-player-section">
        {currentVideo && <VideoPlayer video={currentVideo} />}
      </div>

      <aside className="vp-sidebar">
        {loading ? (
          /* Exemple de squelette de chargement */
          Array(4).fill(null).map((_, index) => (
            <div key={index} className="vp-skeleton">
              <div className="vp-skeleton-thumb"></div>
            </div>
          ))
        ) : (
          <RecommendedVideos videos={recommendedVideos} />
        )}
      </aside>
    </div>
  );
};

export default VideoPage;
