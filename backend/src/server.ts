import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import './workers/emailWorker'; // Initialize worker
import { initElasticsearch } from './services/searchService';

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  await initElasticsearch();
  console.log(`Server is running on port ${PORT}`);
});
