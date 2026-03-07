import { Router } from "express";
import {
  signup,
  bootconfig,
  updateProfile,
  forgotAccessCode,
  verifyOTP,
  generate2FA,
  enable2FA,
  disable2FA,
  generateSignup2FA,
} from "../controllers/auth.controller";

const router = Router();

// POST /auth/signup
router.post("/signup", signup);

// POST /auth/bootconfig
router.post("/bootconfig", bootconfig);

// POST /auth/update-profile
router.post("/update-profile", updateProfile);

// POST /auth/forgot-access-code
router.post("/forgot-access-code", forgotAccessCode);

// POST /auth/verify-otp
router.post("/verify-otp", verifyOTP);

// 2FA Routes
router.post("/2fa/generate", generate2FA);
router.post("/2fa/generate-signup", generateSignup2FA);
router.post("/2fa/enable", enable2FA);
router.post("/2fa/disable", disable2FA);

export default router;
