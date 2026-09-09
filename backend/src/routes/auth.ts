import { Router } from 'express';
import { googleAuth, googleCallback, getCurrentUser, logout, demoLogin } from '../controllers/authController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/demo-login', demoLogin);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', logout);

export default router;
