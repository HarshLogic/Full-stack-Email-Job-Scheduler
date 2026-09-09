import { Worker, Job, DelayedError } from 'bullmq';
import nodemailer from 'nodemailer';
import { connection } from '../config/redis';
import { emailQueueName } from '../queues/emailQueue';
import prisma from '../config/prisma';
import { getTransporter } from '../services/emailService';
import { updateEmailStatus } from '../services/searchService';


const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);
const MIN_EMAIL_DELAY_MS = parseInt(process.env.MIN_EMAIL_DELAY_MS || '2000', 10);
const MAX_EMAILS_PER_HOUR_PER_SENDER = parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '3', 10);

export const emailWorker = new Worker(
  emailQueueName,
  async (job: Job) => {
    const { emailId } = job.data;
    console.log(`\n[Worker] Processing job for email ID: ${emailId}`);

    // --- 1. IDEMPOTENCY CHECK ---
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { campaign: true } // Fetch campaign for limits
    });

    if (!email) {
      console.warn(`[Worker] Email ${emailId} not found in DB. Skipping.`);
      return;
    }

    if (email.status === 'SENT') {
      console.warn(`[Worker] Email ${emailId} was already sent. Idempotency triggered. Skipping.`);
      return;
    }

    if (email.status !== 'SCHEDULED' && email.status !== 'FAILED') {
      console.warn(`[Worker] Email ${emailId} has status ${email.status}. Skipping.`);
      return;
    }

    // Now we know the user, use it for rate limiting
    const senderId = email.userId;
    
    // Use campaign limits if set (allowing 0), otherwise fallback to env vars
    const emailDelayMs = email.campaign?.delay ?? MIN_EMAIL_DELAY_MS;
    const hourlyLimit = email.campaign?.hourlyLimit ?? MAX_EMAILS_PER_HOUR_PER_SENDER;

    // --- 2. MINIMUM DELAY RATE LIMITING (Redis Distributed Lock) ---
    const delayKey = `rate:delay:${senderId}`;
    const acquired = await connection.set(delayKey, '1', 'PX', emailDelayMs, 'NX');

    if (!acquired) {
      const ttl = await connection.pttl(delayKey);
      const delay = ttl > 0 ? ttl : emailDelayMs;
      console.log(`[Worker] Minimum delay enforced. Rescheduling ${emailId} by ${delay}ms`);
      await job.moveToDelayed(Date.now() + delay, job.token!);
      throw new DelayedError();
    }

    // --- 3. HOURLY RATE LIMITING (Redis Atomic Counter) ---
    const now = new Date();
    const hourWindow = now.toISOString().substring(0, 13); // e.g. "2026-09-08T08"
    const hourlyKey = `rate:hourly:${senderId}:${hourWindow}`;

    const count = await connection.incr(hourlyKey);
    if (count === 1) {
      await connection.expire(hourlyKey, 3600); // Expire in 1 hour
    }

    if (count > hourlyLimit) {
      // Calculate milliseconds until the start of the next hour
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(0, 0, 0); // minutes, seconds, ms
      let delay = nextHour.getTime() - Date.now();
      
      // Stagger the delayed jobs slightly to preserve order and avoid a massive spike
      const overage = count - hourlyLimit;
      delay += (overage * emailDelayMs);

      console.log(`[Worker] Hourly limit (${hourlyLimit}) reached. Rescheduling ${emailId} to next hour (delay: ${delay}ms)`);
      
      // If this is the FIRST email to breach the limit (overage === 1), send a Slack notification
      if (overage === 1) {
        try {
          const slackConnection = await prisma.slackConnection.findUnique({
            where: { userId: senderId }
          });
          
          if (slackConnection && slackConnection.accessToken) {
            const axios = require('axios'); // lazy load
            await axios.post('https://slack.com/api/chat.postMessage', {
              channel: slackConnection.slackUserId, // sending to the user who authorized the app as a direct message
              text: `🚨 *Rate Limit Alert*: Hourly email limit (${hourlyLimit}) reached for your account. Remaining scheduled emails have been delayed to the next hour.`
            }, {
              headers: {
                'Authorization': `Bearer ${slackConnection.accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            console.log(`[Worker] Slack notification sent to user ${slackConnection.slackUserId}`);
          }
        } catch (slackErr: any) {
          console.error(`[Worker] Failed to send Slack notification:`, slackErr.response?.data || slackErr.message);
          // If the token is revoked/invalid, we could delete it here, but we'll just skip and not crash the worker.
        }
      }

      await job.moveToDelayed(Date.now() + delay, job.token!);
      throw new DelayedError();
    }

    // --- 4. PROCESSING & SENDING ---
    await prisma.email.update({
      where: { id: emailId },
      data: { status: 'PROCESSING' },
    });
    
    // Sync to ES (fire and forget)
    updateEmailStatus(emailId, 'PROCESSING').catch(console.error);

    try {
      const mailTransporter = await getTransporter();
      const info = await mailTransporter.sendMail({
        from: '"Email Scheduler" <noreply@emailscheduler.com>',
        to: email.recipient,
        subject: email.subject,
        text: email.body,
      });

      console.log(`[Worker] Email ${emailId} sent successfully.`);
      
      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) console.log(`[Worker] Ethereal preview URL: ${testUrl}`);

      // Mark as SENT
      const sentDate = new Date();
      await prisma.email.update({
        where: { id: emailId },
        data: { 
          status: 'SENT',
          sentAt: sentDate,
          messageId: info.messageId,
          error: null
        },
      });
      
      updateEmailStatus(emailId, 'SENT', sentDate).catch(console.error);

    } catch (error: any) {
      console.error(`[Worker] Failed to send email ${emailId}:`, error.message);
      
      await prisma.email.update({
        where: { id: emailId },
        data: { 
          status: 'FAILED',
          error: error.message || 'Unknown error'
        },
      });

      updateEmailStatus(emailId, 'FAILED').catch(console.error);

      throw error;
    }
  },
  {
    connection,
    concurrency,
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  // We ignore DelayedError logging as failure because it's an expected rate-limit mechanism
  if (err.name !== 'DelayedError') {
    console.error(`[Worker] Job ${job?.id} has failed with ${err.message}`);
  }
});
