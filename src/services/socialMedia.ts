// socialMedia.ts
import axios from 'axios';

export interface SocialPost {
  id: string;
  platform: string;
  author: string;
  date: string;
  content: string;
  likes: number;
  avatar: string;
}

// Fonction pour incrémenter les likes d'une image
export async function incrementImageLikes(imageId: string): Promise<number> {
  try {
    const response = await axios.post('/api/incrementLikes', { imageId });
    return response.data.likes;
  } catch (error: any) {
    // Si l'endpoint n'existe pas (404), on laisse l'état optimiste sans afficher d'erreur
    if (error.response && error.response.status === 404) {
      return 0;
    }
    throw error;
  }
}

// Fonction pour décrémenter les likes d'une image (non utilisée pour le moment)
export async function decrementImageLikes(imageId: string): Promise<number> {
  try {
    const response = await axios.post('/api/decrementLikes', { imageId });
    return response.data.likes;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return 0;
    }
    throw error;
  }
}

export async function getAllSocialPosts(): Promise<SocialPost[]> {
  try {
    const posts: SocialPost[] = [];
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    throw error;
  }
}
