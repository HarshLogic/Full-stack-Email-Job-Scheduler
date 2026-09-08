import { Client } from '@elastic/elasticsearch';

const elasticUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

export const esClient = new Client({
  node: elasticUrl,
});

export const EMAIL_INDEX = 'emails';
