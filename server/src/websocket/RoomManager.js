import { Room } from './Room.js';

export class RoomManager {
  constructor() {
    this.roomsByRoomId = new Map();   // roomId (ObjectId str) -> Room
    this.roomsByRoomCode = new Map(); // roomCode ("ABC123") -> Room
    this.userToRoomMap = new Map();   // userId -> roomCode
  }

  createRoom(roomId, roomCode, hostId, videoId) {
    let room = this.roomsByRoomCode.get(roomCode.toUpperCase());
    if (!room) {
      room = new Room({
        roomId,
        roomCode: roomCode.toUpperCase(),
        hostId,
        videoId,
      });
      this.roomsByRoomId.set(roomId, room);
      this.roomsByRoomCode.set(roomCode.toUpperCase(), room);
    }
    return room;
  }

  getRoomByCode(roomCode) {
    if (!roomCode) return null;
    return this.roomsByRoomCode.get(roomCode.toUpperCase()) || null;
  }

  getRoomById(roomId) {
    if (!roomId) return null;
    return this.roomsByRoomId.get(roomId) || null;
  }

  getRoomForUser(userId) {
    const code = this.userToRoomMap.get(userId);
    return code ? this.getRoomByCode(code) : null;
  }

  addParticipantToRoom(roomCode, userId, username, initialRole, ws) {
    const room = this.getRoomByCode(roomCode);
    if (!room) return null;

    // Set role: if creator/host -> HOST, otherwise initialRole (default PARTICIPANT)
    const role = room.hostId === userId ? 'HOST' : initialRole;

    const participant = room.addParticipant(userId, username, role, ws);
    this.userToRoomMap.set(userId, room.roomCode);

    return { room, participant };
  }

  removeParticipantFromRoom(userId) {
    const roomCode = this.userToRoomMap.get(userId);
    if (!roomCode) return null;

    const room = this.getRoomByCode(roomCode);
    this.userToRoomMap.delete(userId);

    if (room) {
      const removedParticipant = room.removeParticipant(userId);

      // If host left and participants remain, assign host to longest-connected participant
      if (room.hostId === userId && room.participants.size > 0) {
        const nextHost = Array.from(room.participants.values()).sort(
          (a, b) => a.joinedAt - b.joinedAt
        )[0];
        if (nextHost) {
          nextHost.role = 'HOST';
          room.hostId = nextHost.userId;
        }
      }

      // If room is completely empty, clean up live room state
      if (room.participants.size === 0) {
        this.deleteRoom(room.roomId);
      }

      return { room, participant: removedParticipant };
    }

    return null;
  }

  deleteRoom(roomId) {
    const room = this.roomsByRoomId.get(roomId);
    if (room) {
      this.roomsByRoomId.delete(roomId);
      this.roomsByRoomCode.delete(room.roomCode);

      for (const userId of room.participants.keys()) {
        this.userToRoomMap.delete(userId);
      }
    }
  }
}

// Export a singleton instance for live state
export const roomManager = new RoomManager();
