import { Router } from 'express';
import { scheduleEmail, search } from '../controllers/emailController';

const router = Router();

router.get('/search', search);
router.post('/schedule', scheduleEmail);

export default router;
