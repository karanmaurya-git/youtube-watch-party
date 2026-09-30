import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: [true, 'Room code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Host ID is required'],
    },
    videoId: {
      type: String,
      default: 'dQw4w9WgXcQ', // Default demo video
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;
