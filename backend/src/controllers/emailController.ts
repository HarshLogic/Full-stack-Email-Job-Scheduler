import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { emailQueue } from '../queues/emailQueue';
import { indexEmail, searchEmails as esSearch } from '../services/searchService';

export const scheduleEmail = async (req: Request, res: Response) => {
  try {
    const { recipients, subject, body, scheduledAt, delay, hourlyLimit } = req.body;

    // Handle both single 'recipient' for backward compatibility, and 'recipients' array
    let emailsList: string[] = [];
    if (Array.isArray(recipients)) {
      emailsList = recipients;
    } else if (req.body.recipient) {
      emailsList = [req.body.recipient];
    }

    if (emailsList.length === 0 || !subject || !body || !scheduledAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const scheduleDate = new Date(scheduledAt);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduledAt date format' });
    }

    // 1. Validate Emails and remove duplicates
    const validEmails = [...new Set(emailsList.filter(email => /^\S+@\S+\.\S+$/.test(email)))];
    
    if (validEmails.length === 0) {
      return res.status(400).json({ error: 'No valid email addresses provided' });
    }

    // 2. Create Campaign
    const campaign = await prisma.campaign.create({
      data: {
        userId: req.user!.id,
        subject,
        body,
        scheduledAt: scheduleDate,
        delay: delay ? parseInt(delay) : null,
        hourlyLimit: hourlyLimit ? parseInt(hourlyLimit) : null,
      }
    });

    // 3. Create Emails in DB (Batching)
    const emailData = validEmails.map(recipient => ({
      recipient,
      subject,
      body,
      scheduledAt: scheduleDate,
      status: 'SCHEDULED' as const,
      userId: req.user!.id,
      campaignId: campaign.id
    }));

    const createdEmails = await prisma.email.createManyAndReturn({
      data: emailData
    });

    // 4. Fire and forget ES index updates
    createdEmails.forEach(email => {
      indexEmail(email, req.user!.id).catch(console.error);
    });

    // 5. Calculate Delay
    const now = new Date().getTime();
    let initialDelay = scheduleDate.getTime() - now;
    if (initialDelay < 0) initialDelay = 0;

    // 6. Add to BullMQ in bulk
    const jobs = createdEmails.map(email => ({
      name: 'send-email',
      data: { emailId: email.id },
      opts: {
        jobId: email.id,
        delay: initialDelay,
      }
    }));

    await emailQueue.addBulk(jobs);

    res.status(201).json({
      message: `Successfully scheduled ${validEmails.length} email(s)`,
      campaignId: campaign.id,
      validCount: validEmails.length,
      invalidCount: emailsList.length - validEmails.length
    });
  } catch (error) {
    console.error('Failed to schedule emails:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const search = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const senderId = req.user!.id;
    
    // If no query, just return all emails from Postgres for simplicity in the dashboard
    if (!q || typeof q !== 'string' || q.trim() === '') {
      const allEmails = await prisma.email.findMany({
        where: { userId: senderId },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json({ results: allEmails });
    }

    // Isolate searches to the authenticated user
    const results = await esSearch(senderId, q);

    res.status(200).json({ results });
  } catch (error: any) {
    // If Elasticsearch is down, we return a 503 so the frontend can handle it gracefully.
    res.status(503).json({ error: 'Search service is currently unavailable' });
  }
};
