import { Router } from 'express';
import { connectSlack, slackCallback, disconnectSlack } from '../controllers/slackController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// /connect requires auth to pass the userId as state
router.get('/connect', requireAuth, connectSlack);

// Callback doesn't require auth middleware because the user might be redirected here natively by Slack, 
// and we read the userId from the state parameter instead.
router.get('/callback', slackCallback);

router.post('/disconnect', requireAuth, disconnectSlack);

export default router;
