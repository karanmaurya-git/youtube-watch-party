import { Participant } from './Participant.js';

export class Room {
  constructor({ roomId, roomCode, hostId, videoId = 'dQw4w9WgXcQ' }) {
    this.roomId = roomId;         // MongoDB ObjectId string
    this.roomCode = roomCode;     // Human-readable code e.g. "ABC123"
    this.hostId = hostId;         // userId of current host
    this.videoId = videoId;
    this.playState = 'paused';    // 'playing' | 'paused'
    this.currentTime = 0;         // in seconds
    this.lastUpdated = Date.now();
    this.participants = new Map(); // userId -> Participant
    this.pendingRequests = new Map(); // requestId -> requestObj
  }

  addParticipant(userId, username, role, ws) {
    const participant = new Participant({ userId, username, role, ws });
    this.participants.set(userId, participant);
    return participant;
  }

  removeParticipant(userId) {
    const participant = this.participants.get(userId);
    if (participant) {
      this.participants.delete(userId);
    }
    return participant;
  }

  getParticipant(userId) {
    return this.participants.get(userId);
  }

  hasParticipant(userId) {
    return this.participants.has(userId);
  }

  getParticipantsList() {
    return Array.from(this.participants.values()).map((p) => p.toJSON());
  }

  updatePlaybackState(playState, currentTime) {
    this.playState = playState;
    if (currentTime !== undefined && currentTime !== null) {
      this.currentTime = Math.max(0, Number(currentTime));
    }
    this.lastUpdated = Date.now();
  }

  setVideo(videoId) {
    this.videoId = videoId;
    this.playState = 'paused';
    this.currentTime = 0;
    this.lastUpdated = Date.now();
    this.pendingRequests.clear(); // Clear old control requests when video changes
  }

  getCalculatedTime() {
    if (this.playState === 'playing') {
      const elapsed = (Date.now() - this.lastUpdated) / 1000;
      return this.currentTime + elapsed;
    }
    return this.currentTime;
  }

  // Broadcast a message to all participants in this room, optionally excluding sender socket
  broadcast(message, excludeWs = null) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    for (const participant of this.participants.values()) {
      if (
        participant.ws &&
        participant.ws !== excludeWs &&
        participant.ws.readyState === 1 // WebSocket.OPEN
      ) {
        participant.ws.send(payload);
      }
    }
  }

  // Permission Check Helper (Backend RBAC)
  hasPermission(userId, action) {
    const participant = this.participants.get(userId);
    if (!participant) return false;

    const role = participant.role;

    switch (action) {
      case 'play':
      case 'pause':
      case 'seek':
      case 'change_video':
      case 'approve_request':
      case 'reject_request':
        return role === 'HOST' || role === 'MODERATOR';

      case 'assign_role':
      case 'remove_participant':
      case 'transfer_host':
        return role === 'HOST';

      case 'control_request':
        return role === 'PARTICIPANT';

      default:
        return false;
    }
  }

  getStateSnapshot() {
    return {
      roomId: this.roomId,
      roomCode: this.roomCode,
      hostId: this.hostId,
      videoId: this.videoId,
      playState: this.playState,
      currentTime: this.getCalculatedTime(),
      participants: this.getParticipantsList(),
      pendingRequests: Array.from(this.pendingRequests.values()),
    };
  }
}
