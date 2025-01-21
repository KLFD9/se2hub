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
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}/tweets`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        },
        params: {
          'tweet.fields': 'created_at,public_metrics',
          'max_results': 5
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Erreur Twitter:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des tweets' });
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
          maxResults: 5
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
    res.status(500).json({ error: 'Erreur lors de la récupération des vidéos' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
}); 