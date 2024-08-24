const express = require('express');
const router = express.Router();
const Url = require('../models/Url');

// Home Route
router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './views' });
});

// Create Short URL
router.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  const url = new Url({ originalUrl });
  await url.save();
  res.json({ shortUrl: `http://localhost:3000/${url.shortUrl}` });
});

// Redirect to Original URL and Track Clicks
router.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const url = await Url.findOne({ shortUrl });

  if (url) {
    url.clicks++;
    await url.save();
    return res.redirect(url.originalUrl);
  }

  res.status(404).json('URL not found');
});

// View Analytics
router.get('/analytics/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const url = await Url.findOne({ shortUrl });

  if (url) {
    res.json({
      originalUrl: url.originalUrl,
      shortUrl: url.shortUrl,
      clicks: url.clicks,
      date: url.date
    });
  } else {
    res.status(404).json('URL not found');
  }
});

module.exports = router;
