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

export async function incrementImageLikes(imageId: string): Promise<number> {
  try {
    const response = await axios.post('/api/incrementLikes', { imageId });
    return response.data.likes;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return 0;
    }
    throw error;
  }
}

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
