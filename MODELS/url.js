const mongoose = require('mongoose');
const shortid = require('shortid');

const UrlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: {
    type: String,
    default: shortid.generate
  },
  clicks: {
    type: Number,
    default: 0
  },
  date: {
    type: String,
    default: Date.now
  }
});

module.exports = mongoose.model('Url', UrlSchema);
