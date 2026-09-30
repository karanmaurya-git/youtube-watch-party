import test from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../src/websocket/Room.js';

test('RBAC Permission Validation Tests', async (t) => {
  const room = new Room({
    roomId: 'room123',
    roomCode: 'RBAC01',
    hostId: 'host_id',
    videoId: 'dQw4w9WgXcQ',
  });

  room.addParticipant('host_id', 'HostUser', 'HOST', null);
  room.addParticipant('mod_id', 'ModUser', 'MODERATOR', null);
  room.addParticipant('part_id', 'PartUser', 'PARTICIPANT', null);

  await t.test('Playback actions permissions', () => {
    // Play/Pause/Seek/Change Video allowed for HOST & MODERATOR
    assert.equal(room.hasPermission('host_id', 'play'), true);
    assert.equal(room.hasPermission('mod_id', 'play'), true);
    assert.equal(room.hasPermission('part_id', 'play'), false, 'PARTICIPANT cannot play directly');

    assert.equal(room.hasPermission('host_id', 'seek'), true);
    assert.equal(room.hasPermission('mod_id', 'seek'), true);
    assert.equal(room.hasPermission('part_id', 'seek'), false, 'PARTICIPANT cannot seek directly');

    assert.equal(room.hasPermission('host_id', 'change_video'), true);
    assert.equal(room.hasPermission('mod_id', 'change_video'), true);
    assert.equal(room.hasPermission('part_id', 'change_video'), false, 'PARTICIPANT cannot change video directly');
  });

  await t.test('Management actions permissions (HOST only)', () => {
    assert.equal(room.hasPermission('host_id', 'assign_role'), true);
    assert.equal(room.hasPermission('mod_id', 'assign_role'), false, 'MODERATOR cannot assign role');
    assert.equal(room.hasPermission('part_id', 'assign_role'), false);

    assert.equal(room.hasPermission('host_id', 'remove_participant'), true);
    assert.equal(room.hasPermission('mod_id', 'remove_participant'), false);
    assert.equal(room.hasPermission('part_id', 'remove_participant'), false);
  });

  await t.test('Control request permissions', () => {
    assert.equal(room.hasPermission('part_id', 'control_request'), true, 'PARTICIPANT can request action');
    assert.equal(room.hasPermission('host_id', 'approve_request'), true);
    assert.equal(room.hasPermission('mod_id', 'approve_request'), true);
  });
});
