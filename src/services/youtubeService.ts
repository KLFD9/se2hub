import axios from 'axios';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';


interface YouTubeSearchResultItem {
    id: {
        videoId: string;
    };
    snippet: {
        title: string;
        description: string;
        thumbnails: {
            high: {
                url: string;
            };
        };
        channelTitle: string;
        publishedAt: string;
    };
}

interface YouTubeVideoStatistics {
    viewCount: string;
    likeCount: string;
    dislikeCount?: string;
    favoriteCount: string;
    commentCount: string;
}

interface YouTubeVideoItem {
    id: string;
    statistics: YouTubeVideoStatistics;
}

export interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    description: string;
    viewCount?: number;
    likeCount?: number;
}

class YouTubeService {
    private static instance: YouTubeService;
    private readonly axios;
    
    private constructor() {
        console.log('[YouTubeService] Initialisation du service YouTube');
        this.axios = axios.create({
            baseURL: YOUTUBE_API_URL,
            params: {
                key: YOUTUBE_API_KEY
            }
        });
    }

    public static getInstance(): YouTubeService {
        if (!YouTubeService.instance) {
            YouTubeService.instance = new YouTubeService();
        }
        return YouTubeService.instance;
    }

    private isSpaceEngineers2Video(title: string, description: string): boolean {
        // Vérifie si le titre contient exactement "Space Engineers 2" (pas juste "Space Engineers")
        const titleMatch = title.match(/\bSpace\s+Engineers\s+2\b/i);
        if (titleMatch) return true;

        // Vérifie les hashtags communs pour SE2
        const hashtagMatch = (title + ' ' + description).match(/#(?:SE2|SpaceEngineers2)\b/i);
        if (hashtagMatch) return true;

        // Vérifie si la description mentionne explicitement Space Engineers 2
        const descriptionMatch = description.match(/\bSpace\s+Engineers\s+2\b/i);
        if (descriptionMatch) return true;

        // Vérifie si la vidéo est postée après l'annonce officielle (octobre 2023)
        const isAfterAnnouncement = new Date(description) >= new Date('2023-10-01');
        if (isAfterAnnouncement && title.includes('Space Engineers')) return true;

        return false;
    }

    async searchSpaceEngineers2Videos(): Promise<YouTubeVideo[]> {
        console.log('[YouTubeService] Recherche des vidéos Space Engineers 2');
        try {
            // Première recherche avec le terme exact
            const response = await this.axios.get<{ items: YouTubeSearchResultItem[] }>('/search', {
                params: {
                    part: 'snippet',
                    q: '"Space Engineers 2" -"Space Engineers 1" -"Space Engineers I"', // Exclure explicitement les références au premier jeu
                    type: 'video',
                    maxResults: 50,
                    order: 'date',
                    relevanceLanguage: 'en' // Recherche en anglais uniquement pour commencer
                }
            });

            console.log(`[YouTubeService] ${response.data.items.length} vidéos trouvées initialement`);

            // Filtrer les résultats pour ne garder que les vidéos pertinentes
            const filteredVideos = response.data.items.filter(item => 
                this.isSpaceEngineers2Video(item.snippet.title, item.snippet.description)
            );

            console.log(`[YouTubeService] ${filteredVideos.length} vidéos retenues après filtrage`);

            if (filteredVideos.length === 0) {
                console.log('[YouTubeService] Aucune vidéo trouvée, tentative avec une recherche plus large');
                return [];
            }

            // Récupérer les statistiques pour chaque vidéo
            const videoIds = filteredVideos.map(item => item.id.videoId).join(',');
            const statsResponse = await this.axios.get<{ items: YouTubeVideoItem[] }>('/videos', {
                params: {
                    part: 'statistics',
                    id: videoIds
                }
            });

            // Combiner les données
            const videoStats = new Map(
                statsResponse.data.items.map(item => [item.id, item.statistics])
            );

            return filteredVideos.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.high.url,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                description: item.snippet.description,
                viewCount: parseInt(videoStats.get(item.id.videoId)?.viewCount || '0'),
                likeCount: parseInt(videoStats.get(item.id.videoId)?.likeCount || '0')
            }));
        } catch (error) {
            console.error('[YouTubeService] Erreur lors de la recherche des vidéos:', error);
            throw error;
        }
    }
}

export default YouTubeService.getInstance(); 