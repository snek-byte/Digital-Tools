const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Url = require('./models/Url');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect('mongodb://localhost:27017/urlshortener', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use('/', require('./routes/index'));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
