import { Queue } from 'bullmq';
import { connection } from '../config/redis';

export const emailQueueName = 'email-queue';

export const emailQueue = new Queue(emailQueueName, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
