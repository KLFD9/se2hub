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

export async function getAllSocialPosts(): Promise<SocialPost[]> {
  try {
    const posts: SocialPost[] = [];
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Erreur lors de la récupération des posts:', error);
    if (axios.isAxiosError(error)) {
      console.error('Détails de l\'erreur:', error.response?.data);
    }
    return [];
  }
} 