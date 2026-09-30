import Room from '../models/Room.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';
import { extractYouTubeId } from '../utils/youtube.js';
import { roomManager } from '../websocket/RoomManager.js';

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
export const createRoom = async (req, res, next) => {
  try {
    const { videoUrl } = req.body;
    let videoId = 'dQw4w9WgXcQ'; // Default

    if (videoUrl) {
      const extracted = extractYouTubeId(videoUrl);
      if (extracted) {
        videoId = extracted;
      }
    }

    // Generate unique room code
    let roomCode;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
      roomCode = generateRoomCode();
      const found = await Room.findOne({ roomCode, status: 'active' });
      if (!found) exists = false;
      attempts++;
    }

    if (exists) {
      res.status(500);
      return next(new Error('Failed to generate a unique room code. Please try again.'));
    }

    // Save persistent metadata in MongoDB
    const room = await Room.create({
      roomCode,
      hostId: req.user._id,
      videoId,
      status: 'active',
    });

    // Initialize in-memory live state in RoomManager
    const liveRoom = roomManager.createRoom(
      room._id.toString(),
      room.roomCode,
      req.user._id.toString(),
      videoId
    );

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        roomId: room._id.toString(),
        roomCode: room.roomCode,
        hostId: room.hostId.toString(),
        videoId: room.videoId,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room details by roomCode
// @route   GET /api/rooms/:roomCode
// @access  Private
export const getRoomByCode = async (req, res, next) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({
      roomCode: roomCode.toUpperCase(),
      status: 'active',
    }).populate('hostId', 'username email');

    if (!room) {
      res.status(404);
      return next(new Error('Room not found or no longer active.'));
    }

    // Get live in-memory room info if active
    const liveRoom = roomManager.getRoomByCode(room.roomCode);

    res.status(200).json({
      success: true,
      data: {
        roomId: room._id.toString(),
        roomCode: room.roomCode,
        host: {
          id: room.hostId._id,
          username: room.hostId.username,
        },
        videoId: liveRoom ? liveRoom.videoId : room.videoId,
        playState: liveRoom ? liveRoom.playState : 'paused',
        currentTime: liveRoom ? liveRoom.currentTime : 0,
        participantCount: liveRoom ? liveRoom.participants.size : 0,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate join eligibility
// @route   POST /api/rooms/:roomCode/join
// @access  Private
export const validateJoinRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({
      roomCode: roomCode.toUpperCase(),
      status: 'active',
    });

    if (!room) {
      res.status(404);
      return next(new Error('Room not found or has been closed.'));
    }

    res.status(200).json({
      success: true,
      message: 'Join validation successful',
      data: {
        roomId: room._id.toString(),
        roomCode: room.roomCode,
        videoId: room.videoId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close room (Host only)
// @route   DELETE /api/rooms/:roomCode
// @access  Private
export const deleteRoom = async (req, res, next) => {
  try {
    const { roomCode } = req.params;

    const room = await Room.findOne({
      roomCode: roomCode.toUpperCase(),
      status: 'active',
    });

    if (!room) {
      res.status(404);
      return next(new Error('Room not found.'));
    }

    if (room.hostId.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Only the room host can delete this room.'));
    }

    room.status = 'closed';
    await room.save();

    // Destroy in-memory live state
    roomManager.deleteRoom(room._id.toString());

    res.status(200).json({
      success: true,
      message: 'Room closed successfully',
    });
  } catch (error) {
    next(error);
  }
};
