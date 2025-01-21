import axios from 'axios';

interface SocialPost {
  id: string;
  platform: 'twitter' | 'youtube';
  author: string;
  date: string;
  content: string;
  likes: number;
  shares?: number;
  views?: number;
  link: string;
}

interface TwitterResponse {
  data: {
    id: string;
    text: string;
    created_at: string;
    public_metrics: {
      like_count: number;
      retweet_count: number;
    };
  }[];
}

interface YouTubeSearchResponse {
  items: {
    id: {
      videoId: string;
    };
    snippet: {
      publishedAt: string;
      channelTitle: string;
      title: string;
    };
    statistics?: {
      viewCount: string;
      likeCount: string;
    };
  }[];
}

// Configuration des comptes à suivre
const TWITTER_USERNAMES = ['vercel', 'reactjs']; // Comptes tech populaires et actifs
const YOUTUBE_CHANNEL_IDS = ['UCiIu5_NeaCkv3Nt8R5u7pNg']; // Space Engineers

// URL du serveur proxy
const API_BASE_URL = 'http://localhost:3001/api';

export async function getTwitterPosts(): Promise<SocialPost[]> {
  try {
    const posts: SocialPost[] = [];
    
    for (const username of TWITTER_USERNAMES) {
      const response = await axios.get<TwitterResponse>(
        `${API_BASE_URL}/twitter/${username}/tweets`
      );

      const tweets = response.data.data;
      tweets.forEach((tweet) => {
        posts.push({
          id: tweet.id,
          platform: 'twitter',
          author: `@${username}`,
          date: new Date(tweet.created_at).toLocaleDateString('fr-FR'),
          content: tweet.text,
          likes: tweet.public_metrics.like_count,
          shares: tweet.public_metrics.retweet_count,
          link: `https://twitter.com/${username}/status/${tweet.id}`
        });
      });
    }
    
    return posts;
  } catch (error) {
    console.error('Erreur lors de la récupération des tweets:', error);
    return [];
  }
}

export async function getYoutubePosts(): Promise<SocialPost[]> {
  try {
    const posts: SocialPost[] = [];
    
    for (const channelId of YOUTUBE_CHANNEL_IDS) {
      const response = await axios.get<YouTubeSearchResponse>(
        `${API_BASE_URL}/youtube/${channelId}/videos`
      );

      const videos = response.data.items;
      videos.forEach((video) => {
        if (video.statistics) {
          posts.push({
            id: video.id.videoId,
            platform: 'youtube',
            author: video.snippet.channelTitle,
            date: new Date(video.snippet.publishedAt).toLocaleDateString('fr-FR'),
            content: video.snippet.title,
            likes: parseInt(video.statistics.likeCount),
            views: parseInt(video.statistics.viewCount),
            link: `https://youtube.com/watch?v=${video.id.videoId}`
          });
        }
      });
    }
    
    return posts;
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos YouTube:', error);
    return [];
  }
}

export async function getAllSocialPosts(): Promise<SocialPost[]> {
  try {
    const [twitterPosts, youtubePosts] = await Promise.all([
      getTwitterPosts(),
      getYoutubePosts()
    ]);

    // Combine et trie les posts par date
    return [...twitterPosts, ...youtubePosts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Erreur lors de la récupération des posts:', error);
    return [];
  }
} 