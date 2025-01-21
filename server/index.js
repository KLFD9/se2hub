const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Route pour Twitter
app.get('/api/twitter/:username/tweets', async (req, res) => {
  try {
    const { username } = req.params;
    const token = process.env.TWITTER_BEARER_TOKEN.trim();
    
    console.log('Tentative de récupération des tweets pour:', username);
    console.log('Token utilisé (premiers caractères):', token.substring(0, 10) + '...');
    
    // Configuration de base pour les requêtes Twitter
    const twitterConfig = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    console.log('Vérification de la validité du token...');
    try {
      // Test de validation du token
      await axios.get('https://api.twitter.com/2/tweets/search/recent?query=test', twitterConfig);
      console.log('Token validé avec succès');
    } catch (error) {
      console.error('Erreur de validation du token:', {
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error('Token invalide ou problème d\'authentification');
    }
    
    // D'abord, obtenir l'ID de l'utilisateur
    console.log('Recherche de l\'ID utilisateur pour:', username);
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      twitterConfig
    );

    console.log('Réponse de la recherche utilisateur:', userResponse.data);

    if (!userResponse.data.data) {
      throw new Error('Utilisateur non trouvé');
    }

    const userId = userResponse.data.data.id;
    console.log('ID utilisateur trouvé:', userId);

    // Ensuite, obtenir les tweets
    console.log('Récupération des tweets pour l\'utilisateur:', userId);
    const response = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        ...twitterConfig,
        params: {
          'tweet.fields': 'created_at,public_metrics',
          'max_results': 5,
          'exclude': 'retweets,replies'
        }
      }
    );

    console.log('Tweets récupérés avec succès');
    
    if (!response.data.data) {
      return res.json({ data: [] });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Erreur Twitter détaillée:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        headers: {
          ...error.config?.headers,
          Authorization: 'Bearer [MASQUÉ]' // On masque le token dans les logs
        }
      }
    });
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
          'Referer': 'http://localhost:4000',
          'Origin': 'http://localhost:4000'
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
          'Referer': 'http://localhost:4000',
          'Origin': 'http://localhost:4000'
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