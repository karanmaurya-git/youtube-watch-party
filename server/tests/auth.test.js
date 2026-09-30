import test from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, verifyToken } from '../src/utils/jwt.js';
import { createWsTicket, consumeWsTicket } from '../src/utils/wsTickets.js';
import User from '../src/models/User.js';

test('Auth Unit Tests - JWT & Passwords & WS Tickets', async (t) => {
  await t.test('JWT token generation and verification', () => {
    const userId = '507f1f77bcf86cd799439011';
    const token = generateToken(userId);
    assert.ok(token, 'Token should be generated');

    const decoded = verifyToken(token);
    assert.equal(decoded.id, userId, 'Decoded ID should match original user ID');
  });

  await t.test('Password hashing and comparison', async () => {
    const password = 'mySecretPassword123';
    const hash = await User.hashPassword(password);
    assert.notEqual(password, hash, 'Hashed password should not equal plain password');

    const dummyUser = new User({ username: 'testuser', email: 'test@example.com', passwordHash: hash });
    const match = await dummyUser.matchPassword(password);
    assert.equal(match, true, 'Password matching should return true for correct password');

    const wrongMatch = await dummyUser.matchPassword('wrongPassword');
    assert.equal(wrongMatch, false, 'Password matching should return false for wrong password');
  });

  await t.test('WebSocket single-use ticket creation and consumption', () => {
    const fakeUser = { _id: '507f1f77bcf86cd799439011', username: 'karan' };
    const ticket = createWsTicket(fakeUser);
    assert.ok(ticket, 'Ticket should be generated');

    const consumed = consumeWsTicket(ticket);
    assert.ok(consumed, 'Ticket should be consumed successfully');
    assert.equal(consumed.username, 'karan');

    const replay = consumeWsTicket(ticket);
    assert.equal(replay, null, 'Ticket replay should return null (single-use constraint)');
  });
});
