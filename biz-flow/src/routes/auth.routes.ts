import { Router } from 'express';
import { signup, bootconfig, updateProfile } from '../controllers/auth.controller';

const router = Router();

// POST /auth/signup
router.post('/signup', signup);

// POST /auth/bootconfig
router.post('/bootconfig', bootconfig);

// POST /auth/update-profile
router.post('/update-profile', updateProfile);

export default router;
