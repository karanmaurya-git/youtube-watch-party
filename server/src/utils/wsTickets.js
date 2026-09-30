import crypto from 'crypto';

// In-memory store for short-lived, single-use WebSocket tickets
// ticket -> { userId, username, expiresAt }
const wsTickets = new Map();

// Clean up expired tickets periodically (every 60 seconds)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ticket, data] of wsTickets.entries()) {
    if (data.expiresAt < now) {
      wsTickets.delete(ticket);
    }
  }
}, 60000);
cleanupInterval.unref();

export const createWsTicket = (user) => {
  const ticket = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 30000; // Ticket valid for 30 seconds

  wsTickets.set(ticket, {
    userId: user._id.toString(),
    username: user.username,
    expiresAt,
  });

  return ticket;
};

export const consumeWsTicket = (ticket) => {
  if (!ticket || !wsTickets.has(ticket)) {
    return null;
  }

  const data = wsTickets.get(ticket);
  wsTickets.delete(ticket); // Single-use!

  if (Date.now() > data.expiresAt) {
    return null; // Expired
  }

  return data;
};
