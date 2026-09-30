import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  getWsTicket,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateRegisterInput,
  validateLoginInput,
} from '../middleware/validation.js';

const router = express.Router();

router.post('/register', validateRegisterInput, registerUser);
router.post('/login', validateLoginInput, loginUser);
router.get('/me', protect, getMe);
router.post('/ws-ticket', protect, getWsTicket);

export default router;
