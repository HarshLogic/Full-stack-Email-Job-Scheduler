import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import './workers/emailWorker'; // Initialize worker
import { initElasticsearch } from './services/searchService';

const PORT = parseInt(process.env.PORT || '4000', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  initElasticsearch().catch((err) => {
    console.warn('[Elasticsearch] Optional index init skipped:', err.message);
  });
});

