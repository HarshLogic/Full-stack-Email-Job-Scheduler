import { esClient, EMAIL_INDEX } from '../config/elasticsearch';
import { Email } from '@prisma/client';

export const initElasticsearch = async () => {
  try {
    const indexExists = await esClient.indices.exists({ index: EMAIL_INDEX });
    if (!indexExists) {
      await esClient.indices.create({
        index: EMAIL_INDEX,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            senderId: { type: 'keyword' }, // Used for isolating user searches
            recipient: { type: 'text' },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            scheduledAt: { type: 'date' },
            sentAt: { type: 'date' }
          }
        }
      });
      console.log(`[Elasticsearch] Index '${EMAIL_INDEX}' created.`);
    }
  } catch (error: any) {
    console.error(`[Elasticsearch] Failed to initialize index:`, error.message);
  }
};

export const indexEmail = async (email: Email, senderId: string) => {
  try {
    await esClient.index({
      index: EMAIL_INDEX,
      id: email.id,
      document: {
        id: email.id,
        senderId,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledAt: email.scheduledAt,
        sentAt: email.sentAt,
      }
    });
  } catch (error: any) {
    console.error(`[Elasticsearch] Failed to index email ${email.id}:`, error.message);
  }
};

export const updateEmailStatus = async (emailId: string, status: string, sentAt?: Date | null) => {
  try {
    const doc: any = { status };
    if (sentAt) doc.sentAt = sentAt;

    await esClient.update({
      index: EMAIL_INDEX,
      id: emailId,
      doc,
    });
  } catch (error: any) {
    console.error(`[Elasticsearch] Failed to update email ${emailId}:`, error.message);
  }
};

export const searchEmails = async (senderId: string, query: string) => {
  try {
    const result = await esClient.search({
      index: EMAIL_INDEX,
      query: {
        bool: {
          must: [
            { term: { senderId } }, // Enforce tenant isolation
            {
              multi_match: {
                query,
                fields: ['recipient', 'subject', 'body', 'status'],
                fuzziness: 'AUTO'
              }
            }
          ]
        }
      }
    });
    return result.hits.hits.map(hit => hit._source);
  } catch (error: any) {
    console.error(`[Elasticsearch] Search failed:`, error.message);
    throw new Error('Search unavailable'); // We throw here so the API can return 503
  }
};
