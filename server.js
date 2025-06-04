const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route pour récupérer les actualités
app.get('/api/news', async (req, res) => {
  try {
    console.log('Tentative de récupération des actualités...');
    const response = await axios.get('https://2.spaceengineersgame.com/news/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log('Réponse reçue, analyse du contenu...');
    const $ = cheerio.load(response.data);
    const posts = [];

    $('.post-card').each((i, element) => {
      const $element = $(element);
      const title = $element.find('.post-card-title').text().trim();
      const excerpt = $element.find('.post-card-excerpt').text().trim();
      const image = $element.find('img').attr('src') || '/default-image.jpg';
      const date = $element.find('.post-card-meta time').attr('datetime');
      const category = $element.find('.post-card-primary-tag').text().trim();
      const tags = [];
      
      $element.find('.post-card-tags .post-card-tag').each((_, tag) => {
        tags.push($(tag).text().trim());
      });

      posts.push({
        id: i + 1,
        title,
        category: category || 'News',
        date: date || new Date().toISOString(),
        readTime: '5 min',
        content: excerpt,
        excerpt: excerpt.slice(0, 150) + '...',
        image,
        trending: i < 2,
        tags
      });
    });

    console.log(`${posts.length} articles trouvés`);
    res.json(posts);
  } catch (error) {
    console.error('Erreur lors du scraping des actualités:', error.message);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des actualités',
      details: error.message 
    });
  }
});

// Recherche de mods sur le Workshop Steam
app.get('/api/mods/search', async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Paramètre q manquant' });
  }

  try {
    const searchUrl = `https://steamcommunity.com/workshop/browse/?appid=244850&searchtext=${encodeURIComponent(
      query
    )}&numperpage=10`;
    const response = await axios.get(searchUrl);
    const $ = cheerio.load(response.data);
    const mods = [];

    $('.workshopItem').each((_, el) => {
      const link = $(el).find('a.ugc').attr('href');
      const idMatch = link && link.match(/\?id=(\d+)/);
      const id = idMatch ? idMatch[1] : null;
      const name = $(el).find('.workshopItemTitle').text().trim();
      const image = $(el).find('.workshopItemPreviewImage').attr('src');
      if (id) {
        mods.push({ id, name, image });
      }
    });

    res.json({ mods });
  } catch (error) {
    console.error('Erreur lors de la recherche de mods:', error.message);
    res.status(500).json({ error: 'Échec de la récupération des mods' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
}); 