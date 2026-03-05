import { Router } from 'express';
import { signup, bootconfig, updateProfile, forgotAccessCode, verifyOTP } from '../controllers/auth.controller';

const router = Router();

// POST /auth/signup
router.post('/signup', signup);

// POST /auth/bootconfig
router.post('/bootconfig', bootconfig);

// POST /auth/update-profile
router.post('/update-profile', updateProfile);

// POST /auth/forgot-access-code
router.post('/forgot-access-code', forgotAccessCode);

// POST /auth/verify-otp
router.post('/verify-otp', verifyOTP);

export default router;
