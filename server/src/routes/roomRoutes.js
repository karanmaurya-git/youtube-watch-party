import express from 'express';
import {
  createRoom,
  getRoomByCode,
  validateJoinRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createRoom);
router.get('/:roomCode', protect, getRoomByCode);
router.post('/:roomCode/join', protect, validateJoinRoom);
router.delete('/:roomCode', protect, deleteRoom);

export default router;
