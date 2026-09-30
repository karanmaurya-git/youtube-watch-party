import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRoomCode } from '../src/utils/generateRoomCode.js';
import { extractYouTubeId } from '../src/utils/youtube.js';
import { RoomManager } from '../src/websocket/RoomManager.js';

test('Room & YouTube Utilities Unit Tests', async (t) => {
  await t.test('Room code generator', () => {
    const code = generateRoomCode();
    assert.equal(code.length, 6, 'Room code should be 6 characters long');
    assert.equal(code, code.toUpperCase(), 'Room code should be uppercase');
  });

  await t.test('YouTube URL parser', () => {
    assert.equal(extractYouTubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'), 'dQw4w9WgXcQ');
    assert.equal(extractYouTubeId('invalid-url'), null);
  });

  await t.test('In-Memory RoomManager operations', () => {
    const rm = new RoomManager();
    const roomId = '507f1f77bcf86cd799439011';
    const roomCode = 'TEST12';
    const hostId = 'user1';

    const room = rm.createRoom(roomId, roomCode, hostId, 'dQw4w9WgXcQ');
    assert.ok(room, 'Room should be created in memory');
    assert.equal(room.roomCode, 'TEST12');

    // Add host
    const res1 = rm.addParticipantToRoom('TEST12', 'user1', 'HostUser', 'HOST', null);
    assert.equal(res1.participant.role, 'HOST');

    // Add participant
    const res2 = rm.addParticipantToRoom('TEST12', 'user2', 'GuestUser', 'PARTICIPANT', null);
    assert.equal(res2.participant.role, 'PARTICIPANT');

    assert.equal(room.participants.size, 2, 'Room should have 2 participants');

    // Remove host -> test auto reassignment of host to remaining participant
    rm.removeParticipantFromRoom('user1');
    assert.equal(room.hostId, 'user2', 'user2 should become new host after host leaves');
    assert.equal(room.getParticipant('user2').role, 'HOST');

    // Remove user2 -> room empty -> deleted
    rm.removeParticipantFromRoom('user2');
    assert.equal(rm.getRoomByCode('TEST12'), null, 'Empty room should be cleaned up from memory');
  });
});
