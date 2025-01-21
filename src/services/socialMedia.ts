import axios from 'axios';

export interface SocialPost {
  id: string;
  platform: 'youtube';
  author: string;
  date: string;
  content: string;
  likes: number;
  views?: number;
  videoId: string;
  thumbnail: string;
}

interface YouTubeChannelResponse {
  items?: {
    contentDetails?: {
      relatedPlaylists?: {
        uploads: string;
      };
    };
  }[];
}

interface YouTubePlaylistResponse {
  items?: {
    snippet: {
      publishedAt: string;
      title: string;
      resourceId: {
        videoId: string;
      };
      channelTitle: string;
      thumbnails: {
        high: {
          url: string;
        };
      };
    };
  }[];
}

interface YouTubeVideoResponse {
  items?: {
    statistics: {
      viewCount: string;
      likeCount: string;
    };
  }[];
}

// Configuration des chaînes YouTube à suivre
const YOUTUBE_CHANNEL_IDS = [
  'UCiIu5_NeaCkv3Nt8R5u7pNg', // Space Engineers
];

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

// Instance axios pour l'API YouTube
const youtubeApi = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3',
  params: {
    key: YOUTUBE_API_KEY
  }
});

async function getChannelUploadsPlaylistId(channelId: string): Promise<string | null> {
  try {
    console.log('Récupération de la playlist pour la chaîne:', channelId);
    const response = await youtubeApi.get<YouTubeChannelResponse>('/channels', {
      params: {
        id: channelId,
        part: 'contentDetails',
      }
    });

    console.log('Réponse de l\'API channels:', response.data);
    return response.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la playlist:', error);
    if (axios.isAxiosError(error)) {
      console.error('Détails de l\'erreur:', error.response?.data);
    }
    return null;
  }
}

export async function getYoutubePosts(): Promise<SocialPost[]> {
  try {
    const posts: SocialPost[] = [];
    
    for (const channelId of YOUTUBE_CHANNEL_IDS) {
      try {
        console.log(`Récupération des vidéos pour la chaîne: ${channelId}`);
        
        // 1. Obtenir l'ID de la playlist "Uploads" de la chaîne
        const uploadsPlaylistId = await getChannelUploadsPlaylistId(channelId);
        
        if (!uploadsPlaylistId) {
          console.warn(`Impossible de trouver la playlist uploads pour la chaîne: ${channelId}`);
          continue;
        }

        // 2. Obtenir les dernières vidéos de la playlist
        const playlistResponse = await youtubeApi.get<YouTubePlaylistResponse>('/playlistItems', {
          params: {
            playlistId: uploadsPlaylistId,
            part: 'snippet',
            maxResults: 10
          }
        });

        if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
          console.warn(`Pas de vidéos trouvées dans la playlist de la chaîne: ${channelId}`);
          continue;
        }

        // 3. Pour chaque vidéo, obtenir les statistiques
        for (const item of playlistResponse.data.items) {
          const videoId = item.snippet.resourceId.videoId;
          
          const videoResponse = await youtubeApi.get<YouTubeVideoResponse>('/videos', {
            params: {
              id: videoId,
              part: 'statistics'
            }
          });

          if (videoResponse.data.items?.[0]) {
            const stats = videoResponse.data.items[0].statistics;
            posts.push({
              id: videoId,
              platform: 'youtube',
              author: item.snippet.channelTitle,
              date: new Date(item.snippet.publishedAt).toLocaleDateString('fr-FR'),
              content: item.snippet.title,
              likes: parseInt(stats.likeCount) || 0,
              views: parseInt(stats.viewCount) || 0,
              videoId: videoId,
              thumbnail: item.snippet.thumbnails.high.url
            });
          }
        }
      } catch (channelError) {
        console.error(`Erreur lors de la récupération des vidéos pour la chaîne ${channelId}:`, channelError);
        if (axios.isAxiosError(channelError)) {
          console.error('Détails de l\'erreur:', channelError.response?.data);
        }
      }
    }
    
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos YouTube:', error);
    if (axios.isAxiosError(error)) {
      console.error('Détails de l\'erreur:', error.response?.data);
    }
    return [];
  }
}

// Fonction principale pour obtenir tous les posts sociaux
export async function getAllSocialPosts(): Promise<SocialPost[]> {
  return getYoutubePosts();
} 