import { roomManager } from './RoomManager.js';
import RoomModel from '../models/Room.js';
import { extractYouTubeId } from '../utils/youtube.js';
import crypto from 'crypto';

export class WebSocketMessageHandler {
  static async handleMessage(ws, messageRaw, clientInfo) {
    let data;
    try {
      data = JSON.parse(messageRaw);
    } catch (err) {
      return this.sendError(ws, 'INVALID_MESSAGE', 'Malformed JSON payload.');
    }

    const { type, roomCode, payload } = data;
    const { userId, username } = clientInfo;

    if (!type) {
      return this.sendError(ws, 'INVALID_MESSAGE', 'Message type is required.');
    }

    switch (type) {
      case 'join_room':
        return await this.handleJoinRoom(ws, data, clientInfo);

      case 'leave_room':
        return this.handleLeaveRoom(ws, clientInfo);

      case 'play':
        return this.handlePlay(ws, roomCode, clientInfo);

      case 'pause':
        return this.handlePause(ws, roomCode, clientInfo);

      case 'seek':
        return this.handleSeek(ws, roomCode, data.time, clientInfo);

      case 'change_video':
        return await this.handleChangeVideo(ws, roomCode, data.videoId, clientInfo);

      case 'assign_role':
        return this.handleAssignRole(ws, roomCode, data.targetUserId, data.role, clientInfo);

      case 'remove_participant':
        return this.handleRemoveParticipant(ws, roomCode, data.targetUserId, clientInfo);

      case 'transfer_host':
        return this.handleTransferHost(ws, roomCode, data.targetUserId, clientInfo);

      case 'control_request':
        return this.handleControlRequest(ws, roomCode, data.action, data.payload, clientInfo);

      case 'approve_request':
        return this.handleApproveRequest(ws, roomCode, data.requestId, clientInfo);

      case 'reject_request':
        return this.handleRejectRequest(ws, roomCode, data.requestId, clientInfo);

      default:
        return this.sendError(ws, 'UNKNOWN_TYPE', `Unsupported message type: ${type}`);
    }
  }

  // --- 1. JOIN ROOM ---
  static async handleJoinRoom(ws, data, clientInfo) {
    const { roomCode } = data;
    const { userId, username } = clientInfo;

    if (!roomCode) {
      return this.sendError(ws, 'INVALID_MESSAGE', 'roomCode is required to join a room.');
    }

    const codeUpper = roomCode.toUpperCase();
    let room = roomManager.getRoomByCode(codeUpper);

    // If room is not yet in memory, fetch persistent metadata from MongoDB
    if (!room) {
      const dbRoom = await RoomModel.findOne({ roomCode: codeUpper, status: 'active' });
      if (!dbRoom) {
        return this.sendError(ws, 'ROOM_NOT_FOUND', `Room with code ${codeUpper} not found.`);
      }
      room = roomManager.createRoom(
        dbRoom._id.toString(),
        dbRoom.roomCode,
        dbRoom.hostId.toString(),
        dbRoom.videoId
      );
    }

    // Determine role (HOST if room hostId, else PARTICIPANT)
    const role = room.hostId === userId ? 'HOST' : 'PARTICIPANT';

    const result = roomManager.addParticipantToRoom(codeUpper, userId, username, role, ws);
    if (!result) {
      return this.sendError(ws, 'JOIN_FAILED', 'Failed to join room.');
    }

    ws.currentRoomCode = codeUpper;

    // Send full sync_state to the joining client
    ws.send(
      JSON.stringify({
        type: 'sync_state',
        ...room.getStateSnapshot(),
        myRole: result.participant.role,
      })
    );

    // Broadcast user_joined to all other clients in room
    room.broadcast(
      {
        type: 'user_joined',
        roomCode: codeUpper,
        user: result.participant.toJSON(),
      },
      ws
    );

    // Broadcast updated participant list
    room.broadcast({
      type: 'participants_updated',
      roomCode: codeUpper,
      participants: room.getParticipantsList(),
    });
  }

  // --- 2. LEAVE ROOM ---
  static handleLeaveRoom(ws, clientInfo) {
    const { userId, username } = clientInfo;
    const result = roomManager.removeParticipantFromRoom(userId);

    if (result && result.room) {
      const { room } = result;
      delete ws.currentRoomCode;

      // Broadcast user_left
      room.broadcast({
        type: 'user_left',
        roomCode: room.roomCode,
        user: { userId, username },
      });

      // Broadcast updated participant list
      room.broadcast({
        type: 'participants_updated',
        roomCode: room.roomCode,
        participants: room.getParticipantsList(),
      });
    }
  }

  // --- 3. PLAY ---
  static handlePlay(ws, roomCode, clientInfo) {
    const room = this.validateRoomAndRole(ws, roomCode, clientInfo.userId, 'play');
    if (!room) return;

    room.updatePlaybackState('playing');

    room.broadcast({
      type: 'play',
      roomCode: room.roomCode,
      currentTime: room.getCalculatedTime(),
    });
  }

  // --- 4. PAUSE ---
  static handlePause(ws, roomCode, clientInfo) {
    const room = this.validateRoomAndRole(ws, roomCode, clientInfo.userId, 'pause');
    if (!room) return;

    room.updatePlaybackState('paused');

    room.broadcast({
      type: 'pause',
      roomCode: room.roomCode,
      currentTime: room.currentTime,
    });
  }

  // --- 5. SEEK ---
  static handleSeek(ws, roomCode, time, clientInfo) {
    const room = this.validateRoomAndRole(ws, roomCode, clientInfo.userId, 'seek');
    if (!room) return;

    if (time === undefined || time === null || isNaN(time) || time < 0) {
      return this.sendError(ws, 'INVALID_SEEK_TIME', 'Seek time must be a non-negative number.');
    }

    const seekTime = Number(time);
    room.updatePlaybackState(room.playState, seekTime);

    room.broadcast({
      type: 'seek',
      roomCode: room.roomCode,
      time: seekTime,
      playState: room.playState,
    });
  }

  // --- 6. CHANGE VIDEO ---
  static async handleChangeVideo(ws, roomCode, videoIdOrUrl, clientInfo) {
    const room = this.validateRoomAndRole(ws, roomCode, clientInfo.userId, 'change_video');
    if (!room) return;

    const extractedId = extractYouTubeId(videoIdOrUrl);
    if (!extractedId) {
      return this.sendError(ws, 'INVALID_VIDEO', 'Invalid YouTube Video ID or URL.');
    }

    room.setVideo(extractedId);

    // Optionally update MongoDB
    await RoomModel.updateOne({ _id: room.roomId }, { videoId: extractedId });

    room.broadcast({
      type: 'change_video',
      roomCode: room.roomCode,
      videoId: extractedId,
    });
  }

  // --- 7. ASSIGN ROLE (HOST only) ---
  static handleAssignRole(ws, roomCode, targetUserId, newRole, clientInfo) {
    const room = this.validateRoomAndRole(ws, roomCode, clientInfo.userId, 'assign_role');
    if (!room) return;

    if (!['MODERATOR', 'PARTICIPANT'].includes(newRole)) {
      return this.sendError(ws, 'INVALID_ROLE', 'Target role must be MODERATOR or PARTICIPANT.');
    }

    const targetParticipant = room.getParticipant(targetUserId);
    if (!targetParticipant) {
      return this.sendError(ws, 'USER_NOT_FOUND', 'Target user is not in this room.');
    }

    // Host cannot change their own HOST role through assign_role
    if (targetUserId === room.hostId) {
      return this.sendError(ws, 'FORBIDDEN', 'Host cannot demote themselves via role assignment. Use transfer_host.');
    }

    targetParticipant.role = newRole;

    // Broadcast role_assigned & participants_updated
    room.broadcast({
      type: 'role_assigned',
      roomCode: room.roomCode,
      targetUserId,
      role: newRole,
    });

    room.broadcast({
      type: 'participants_updated',
      roomCode: room.roomCode,
      participants: room.getParticipantsList(),
    });
  }

  // --- 8. REMOVE PARTICIPANT (HOST only) ---
  static handleRemoveParticipant(ws, roomCode, targetUserId, clientInfo) {
    const room = this.validateRoomAndRole(ws, roomCode, clientInfo.userId, 'remove_participant');
    if (!room) return;

    if (targetUserId === room.hostId) {
      return this.sendError(ws, 'FORBIDDEN', 'Host cannot remove themselves from the room.');
    }

    const targetParticipant = room.getParticipant(targetUserId);
    if (!targetParticipant) {
      return this.sendError(ws, 'USER_NOT_FOUND', 'Target participant not found.');
    }

    // Notify target participant directly before closing socket
    if (targetParticipant.ws && targetParticipant.ws.readyState === 1) {
      targetParticipant.ws.send(
        JSON.stringify({
          type: 'participant_removed',
          reason: 'You were removed from the room by the host.',
        })
      );
      targetParticipant.ws.close(4001, 'Removed by host');
    }

    roomManager.removeParticipantFromRoom(targetUserId);

    room.broadcast({
      type: 'user_left',
      roomCode: room.roomCode,
      user: { userId: targetUserId, username: targetParticipant.username },
    });

    room.broadcast({
      type: 'participants_updated',
      roomCode: room.roomCode,
      participants: room.getParticipantsList(),
    });
  }

  // --- 9. TRANSFER HOST (HOST only) ---
  static handleTransferHost(ws, roomCode, targetUserId, clientInfo) {
    const room = this.validateRoomAndRole(ws, roomCode, clientInfo.userId, 'transfer_host');
    if (!room) return;

    const targetParticipant = room.getParticipant(targetUserId);
    if (!targetParticipant) {
      return this.sendError(ws, 'USER_NOT_FOUND', 'Target participant not found.');
    }

    const currentHost = room.getParticipant(clientInfo.userId);
    if (currentHost) {
      currentHost.role = 'MODERATOR'; // Old host becomes Moderator
    }

    targetParticipant.role = 'HOST';
    room.hostId = targetUserId;

    room.broadcast({
      type: 'host_transferred',
      roomCode: room.roomCode,
      newHostId: targetUserId,
      newHostUsername: targetParticipant.username,
    });

    room.broadcast({
      type: 'participants_updated',
      roomCode: room.roomCode,
      participants: room.getParticipantsList(),
    });
  }

  // --- 10. CONTROL REQUEST (PARTICIPANT -> HOST/MOD) ---
  static handleControlRequest(ws, roomCode, action, payload, clientInfo) {
    const room = roomManager.getRoomByCode(roomCode);
    if (!room || !room.hasParticipant(clientInfo.userId)) {
      return this.sendError(ws, 'NOT_IN_ROOM', 'You must be in the room to send a control request.');
    }

    if (!['play', 'pause', 'seek', 'change_video'].includes(action)) {
      return this.sendError(ws, 'INVALID_ACTION', `Invalid action for control request: ${action}`);
    }

    const requestId = crypto.randomBytes(8).toString('hex');
    const request = {
      requestId,
      requesterId: clientInfo.userId,
      requesterName: clientInfo.username,
      action,
      payload: payload || null,
      createdAt: Date.now(),
    };

    room.pendingRequests.set(requestId, request);

    // Broadcast request to all HOST and MODERATOR participants
    for (const participant of room.participants.values()) {
      if (['HOST', 'MODERATOR'].includes(participant.role) && participant.ws && participant.ws.readyState === 1) {
        participant.ws.send(
          JSON.stringify({
            type: 'control_request',
            roomCode: room.roomCode,
            request,
          })
        );
      }
    }
  }

  // --- 11. APPROVE REQUEST (HOST/MOD only) ---
  static handleApproveRequest(ws, roomCode, requestId, clientInfo) {
    const room = this.validateRoomAndRole(ws, roomCode, clientInfo.userId, 'approve_request');
    if (!room) return;

    const request = room.pendingRequests.get(requestId);
    if (!request) {
      return this.sendError(ws, 'REQUEST_NOT_FOUND', 'Control request not found or already processed.');
    }

    room.pendingRequests.delete(requestId);

    // Execute requested action on behalf of room
    switch (request.action) {
      case 'play':
        room.updatePlaybackState('playing');
        room.broadcast({ type: 'play', roomCode: room.roomCode, currentTime: room.getCalculatedTime() });
        break;
      case 'pause':
        room.updatePlaybackState('paused');
        room.broadcast({ type: 'pause', roomCode: room.roomCode, currentTime: room.currentTime });
        break;
      case 'seek':
        if (request.payload && request.payload.time !== undefined) {
          const t = Number(request.payload.time);
          room.updatePlaybackState(room.playState, t);
          room.broadcast({ type: 'seek', roomCode: room.roomCode, time: t, playState: room.playState });
        }
        break;
      case 'change_video':
        if (request.payload && request.payload.videoId) {
          const vId = extractYouTubeId(request.payload.videoId);
          if (vId) {
            room.setVideo(vId);
            room.broadcast({ type: 'change_video', roomCode: room.roomCode, videoId: vId });
          }
        }
        break;
    }

    // Broadcast approval notification
    room.broadcast({
      type: 'request_approved',
      roomCode: room.roomCode,
      requestId,
      approvedBy: clientInfo.username,
    });
  }

  // --- 12. REJECT REQUEST (HOST/MOD only) ---
  static handleRejectRequest(ws, roomCode, requestId, clientInfo) {
    const room = this.validateRoomAndRole(ws, roomCode, clientInfo.userId, 'reject_request');
    if (!room) return;

    const request = room.pendingRequests.get(requestId);
    if (!request) {
      return this.sendError(ws, 'REQUEST_NOT_FOUND', 'Control request not found.');
    }

    room.pendingRequests.delete(requestId);

    room.broadcast({
      type: 'request_rejected',
      roomCode: room.roomCode,
      requestId,
      rejectedBy: clientInfo.username,
    });
  }

  // Helper to validate room membership and RBAC permissions
  static validateRoomAndRole(ws, roomCode, userId, action) {
    const room = roomManager.getRoomByCode(roomCode);

    if (!room) {
      this.sendError(ws, 'ROOM_NOT_FOUND', 'Room not found.');
      return null;
    }

    if (!room.hasParticipant(userId)) {
      this.sendError(ws, 'NOT_IN_ROOM', 'You are not a participant in this room.');
      return null;
    }

    if (!room.hasPermission(userId, action)) {
      this.sendError(ws, 'FORBIDDEN', `You do not have permission to perform '${action}'.`);
      return null;
    }

    return room;
  }

  static sendError(ws, code, message) {
    if (ws && ws.readyState === 1) {
      ws.send(
        JSON.stringify({
          type: 'error',
          code,
          message,
        })
      );
    }
  }
}
