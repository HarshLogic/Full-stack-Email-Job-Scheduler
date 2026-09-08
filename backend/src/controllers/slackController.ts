import { Request, Response } from 'express';
import axios from 'axios';
import prisma from '../config/prisma';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_CALLBACK_URL = process.env.SLACK_CALLBACK_URL;

export const connectSlack = (req: Request, res: Response) => {
  // We need permissions to send messages. 'chat:write' is for bot tokens.
  // 'incoming-webhook' can also be requested to post to a specific channel chosen by the user.
  const scopes = ['chat:write', 'chat:write.public'];
  
  // Pass the userId in the state parameter so we know who authorized it in the callback
  const state = req.user?.id || '';

  const authorizeUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes.join(',')}&redirect_uri=${encodeURIComponent(SLACK_CALLBACK_URL || '')}&state=${state}`;
  
  res.redirect(authorizeUrl);
};

export const slackCallback = async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`Slack OAuth Error: ${error}`);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Authorization code missing');
  }

  const userId = state as string;
  if (!userId) {
    return res.status(400).send('User state missing');
  }

  try {
    // Exchange code for token
    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        client_id: SLACK_CLIENT_ID || '',
        client_secret: SLACK_CLIENT_SECRET || '',
        code,
        redirect_uri: SLACK_CALLBACK_URL || '',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const data = response.data;
    if (!data.ok) {
      console.error('Slack OAuth Error Data:', data);
      return res.status(400).send(`Slack OAuth Failed: ${data.error}`);
    }

    const { access_token, team, authed_user } = data;

    // Upsert the SlackConnection for the user
    await prisma.slackConnection.upsert({
      where: { userId },
      update: {
        accessToken: access_token,
        slackUserId: authed_user?.id,
        teamId: team?.id,
      },
      create: {
        userId,
        accessToken: access_token,
        slackUserId: authed_user?.id,
        teamId: team?.id,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard?slack=connected`);

  } catch (err: any) {
    console.error('Slack Callback Error:', err.message);
    res.status(500).send('Internal Server Error during Slack OAuth');
  }
};

export const disconnectSlack = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await prisma.slackConnection.deleteMany({
      where: { userId }
    });
    res.json({ message: 'Slack disconnected successfully' });
  } catch (error) {
    console.error('Slack Disconnect Error:', error);
    res.status(500).json({ error: 'Failed to disconnect Slack' });
  }
};
