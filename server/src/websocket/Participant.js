export class Participant {
  constructor({ userId, username, role = 'PARTICIPANT', ws }) {
    this.userId = userId;
    this.username = username;
    this.role = role; // 'HOST' | 'MODERATOR' | 'PARTICIPANT'
    this.ws = ws;     // Live WebSocket connection instance (not stored in DB)
    this.joinedAt = Date.now();
  }

  toJSON() {
    return {
      userId: this.userId,
      username: this.username,
      role: this.role,
      joinedAt: this.joinedAt,
    };
  }
}
