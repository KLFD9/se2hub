const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration CORS détaillée
app.use(cors({
  origin: 'http://localhost:5173', // URL du frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route pour Twitter
app.get('/api/twitter/:username/tweets', async (req, res) => {
  try {
    const { username } = req.params;
    const token = process.env.TWITTER_BEARER_TOKEN.trim();
    
    console.log('Tentative de récupération des tweets pour:', username);
    
    // Configuration de base pour les requêtes Twitter
    const twitterConfig = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // D'abord, obtenir l'ID de l'utilisateur
    console.log('Recherche de l\'ID utilisateur pour:', username);
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      twitterConfig
    );

    if (!userResponse.data.data) {
      throw new Error('Utilisateur non trouvé');
    }

    const userId = userResponse.data.data.id;
    console.log('ID utilisateur trouvé:', userId);

    // Ensuite, obtenir les tweets
    const response = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        ...twitterConfig,
        params: {
          'tweet.fields': 'created_at,public_metrics',
          'max_results': 10
        }
      }
    );
    
    if (!response.data.data) {
      return res.json({ data: [] });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Erreur Twitter:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des tweets',
      details: error.response?.data || error.message 
    });
  }
});

// Route pour YouTube
app.get('/api/youtube/:channelId/videos', async (req, res) => {
  try {
    const { channelId } = req.params;
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search`,
      {
        params: {
          key: process.env.YOUTUBE_API_KEY,
          channelId: channelId,
          part: 'snippet',
          order: 'date',
          maxResults: 5,
          type: 'video'
        },
        headers: {
          'Referer': 'http://localhost:5173',
          'Origin': 'http://localhost:5173'
        }
      }
    );
    
    // Récupérer les statistiques pour chaque vidéo
    const videos = response.data.items;
    const videoIds = videos.map(video => video.id.videoId);
    
    const statsResponse = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          key: process.env.YOUTUBE_API_KEY,
          id: videoIds.join(','),
          part: 'statistics'
        },
        headers: {
          'Referer': 'http://localhost:5173',
          'Origin': 'http://localhost:5173'
        }
      }
    );
    
    // Combiner les données
    const videosWithStats = videos.map(video => {
      const stats = statsResponse.data.items.find(
        item => item.id === video.id.videoId
      );
      return {
        ...video,
        statistics: stats ? stats.statistics : null
      };
    });
    
    res.json({ items: videosWithStats });
  } catch (error) {
    console.error('Erreur YouTube:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des vidéos',
      details: error.response?.data || error.message 
    });
  }
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Le serveur fonctionne correctement!' });
});

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
}); 