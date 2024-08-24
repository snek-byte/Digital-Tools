const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Middleware for parsing request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Set up the view engine (Handlebars in this case)
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/urlshortener', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define URL Schema and Model
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  clicks: { type: Number, default: 0 },
  clickData: [{
    date: { type: Date, default: Date.now },
    referrer: String,
    userAgent: String,
    ipAddress: String
  }]
});

const Url = mongoose.model('Url', urlSchema);

// Route to serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Helper function to generate random string
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Route to create a short URL (random or custom)
app.post('/shorten', async (req, res) => {
  let { originalUrl, customAlias } = req.body;

  // Automatically add http:// if not present and handle missing www
  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = 'http://' + originalUrl;
  }
  if (!/^www\./i.test(originalUrl.split('//')[1])) {
    originalUrl = originalUrl.replace(/^(https?:\/\/)/i, '$1www.');
  }

  let shortUrl;

  if (customAlias) {
    if (await Url.findOne({ shortUrl: customAlias })) {
      return res.status(400).json({ message: 'Custom alias is already taken.' });
    }
    shortUrl = customAlias;
  } else {
    shortUrl = generateRandomString();
    while (await Url.findOne({ shortUrl })) {
      shortUrl = generateRandomString();
    }
  }

  const newUrl = new Url({ originalUrl, shortUrl });
  await newUrl.save();

  res.json({
    shortUrl: `http://localhost:3000/${shortUrl}`,  // Use localhost for local testing
    originalUrl: newUrl.originalUrl,
    clicks: newUrl.clicks,
    analyticsUrl: `http://localhost:3000/analytics/${shortUrl}`  // Use localhost for local testing
  });
});

// Route to handle redirection
app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const url = await Url.findOne({ shortUrl });

  if (url) {
    url.clicks++;
    url.clickData.push({
      referrer: req.get('Referrer') || 'Direct',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });
    await url.save();
    res.redirect(url.originalUrl);
  } else {
    res.status(404).json('URL not found');
  }
});

// Route to display analytics data
app.get('/analytics/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const url = await Url.findOne({ shortUrl });

  if (url) {
    res.render('analytics', {
      originalUrl: url.originalUrl,
      shortUrl: `http://localhost:3000/${shortUrl}`,
      clicks: url.clicks,
      clickData: url.clickData
    });
  } else {
    res.status(404).json('URL not found');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
