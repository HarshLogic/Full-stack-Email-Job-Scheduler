import { Router } from 'express';
import { googleAuth, googleCallback, getCurrentUser, logout } from '../controllers/authController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', logout);

export default router;
