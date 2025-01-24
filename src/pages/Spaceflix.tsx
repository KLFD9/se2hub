import React, { useEffect, useState } from 'react';
import youtubeService, { YouTubeVideo } from '../services/youtubeService';
import VideoGrid from '../components/VideoGrid';
import '../styles/pages/Spaceflix.css';

const Spaceflix: React.FC = () => {
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVideos = async () => {
            console.log('[Spaceflix] Chargement des vidéos...');
            try {
                setLoading(true);
                const fetchedVideos = await youtubeService.searchSpaceEngineers2Videos();
                console.log('[Spaceflix] Vidéos chargées avec succès');
                setVideos(fetchedVideos);
                setError(null);
            } catch (err) {
                console.error('[Spaceflix] Erreur lors du chargement des vidéos:', err);
                setError('Une erreur est survenue lors du chargement des vidéos. Veuillez réessayer plus tard.');
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    if (loading) {
        return (
            <div className="spaceflix-loading">
                <div className="loader"></div>
                <p>Chargement des vidéos Space Engineers 2...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="spaceflix-error">
                <h2>Oops!</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
        );
    }

    return (
        <div className="spaceflix-container">
            <main>
                <VideoGrid videos={videos} />
            </main>
        </div>
    );
};

export default Spaceflix; 