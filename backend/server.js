'use strict';

const express = require('express');
const cors = require('cors');
const storeRouter = require('./routes/store');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', storeRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Store backend listening on port ${PORT}`);
  });
}

module.exports = app;
