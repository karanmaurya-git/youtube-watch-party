# 🔌 YouTube Watch Party — WebSocket Protocol Specification

## Overview

All WebSocket messages are sent as JSON strings over a single persistent WebSocket connection (`ws://` in development, `wss://` in production).

---

## Client ➔ Server Messages

### 1. `join_room`
- **Permission**: Authenticated user
- **Payload**:
  ```json
  {
    "type": "join_room",
    "roomCode": "ABC123"
  }
  ```
- **Server Behavior**: Validates `roomCode`, attaches client socket to live room, assigns initial role (`HOST` if room creator, else `PARTICIPANT`), sends `sync_state` to joiner, broadcasts `user_joined` and `participants_updated` to room.

---

### 2. `leave_room`
- **Permission**: In room
- **Payload**:
  ```json
  {
    "type": "leave_room",
    "roomCode": "ABC123"
  }
  ```
- **Server Behavior**: Removes participant from room, reassigns host if host left and participants remain, broadcasts `user_left` and `participants_updated`.

---

### 3. `play`
- **Permission**: `HOST` / `MODERATOR`
- **Payload**:
  ```json
  {
    "type": "play",
    "roomCode": "ABC123"
  }
  ```
- **Server Behavior**: Updates in-memory state `playState = 'playing'`, calculates current time, broadcasts `play` event to room.

---

### 4. `pause`
- **Permission**: `HOST` / `MODERATOR`
- **Payload**:
  ```json
  {
    "type": "pause",
    "roomCode": "ABC123"
  }
  ```
- **Server Behavior**: Updates in-memory state `playState = 'paused'`, broadcasts `pause` event to room.

---

### 5. `seek`
- **Permission**: `HOST` / `MODERATOR`
- **Payload**:
  ```json
  {
    "type": "seek",
    "roomCode": "ABC123",
    "time": 125.5
  }
  ```
- **Server Behavior**: Validates `time >= 0`, updates `currentTime = 125.5`, broadcasts `seek` event.

---

### 6. `change_video`
- **Permission**: `HOST` / `MODERATOR`
- **Payload**:
  ```json
  {
    "type": "change_video",
    "roomCode": "ABC123",
    "videoId": "dQw4w9WgXcQ"
  }
  ```
- **Server Behavior**: Validates YouTube Video ID/URL, resets room state (`paused`, `0s`), updates DB record, broadcasts `change_video`.

---

### 7. `assign_role`
- **Permission**: `HOST` only
- **Payload**:
  ```json
  {
    "type": "assign_role",
    "roomCode": "ABC123",
    "targetUserId": "507f1f77bcf86cd799439011",
    "role": "MODERATOR"
  }
  ```
- **Server Behavior**: Updates target's role (`MODERATOR` or `PARTICIPANT`), broadcasts `role_assigned` and `participants_updated`.

---

### 8. `remove_participant`
- **Permission**: `HOST` only
- **Payload**:
  ```json
  {
    "type": "remove_participant",
    "roomCode": "ABC123",
    "targetUserId": "507f1f77bcf86cd799439011"
  }
  ```
- **Server Behavior**: Notifies target, terminates target socket, removes from room, broadcasts updates.

---

### 9. `transfer_host`
- **Permission**: `HOST` only
- **Payload**:
  ```json
  {
    "type": "transfer_host",
    "roomCode": "ABC123",
    "targetUserId": "507f1f77bcf86cd799439011"
  }
  ```
- **Server Behavior**: Promotes target to `HOST`, demotes current host to `MODERATOR`, broadcasts `host_transferred`.

---

### 10. `control_request`
- **Permission**: `PARTICIPANT`
- **Payload**:
  ```json
  {
    "type": "control_request",
    "roomCode": "ABC123",
    "action": "play",
    "payload": null
  }
  ```
- **Server Behavior**: Stores request in pending queue, sends `control_request` notification to all connected `HOST` and `MODERATOR` participants.

---

### 11. `approve_request` / `reject_request`
- **Permission**: `HOST` / `MODERATOR`
- **Payload**:
  ```json
  {
    "type": "approve_request",
    "roomCode": "ABC123",
    "requestId": "a1b2c3d4"
  }
  ```
- **Server Behavior**: If approved, executes requested action and broadcasts action + `request_approved`. If rejected, broadcasts `request_rejected`.

---

## Server ➔ Client Messages

### `sync_state`
Sent to a client upon joining or reconnecting:
```json
{
  "type": "sync_state",
  "roomId": "507f1f77bcf86cd799439011",
  "roomCode": "ABC123",
  "hostId": "507f1f77bcf86cd799439011",
  "videoId": "dQw4w9WgXcQ",
  "playState": "playing",
  "currentTime": 125.4,
  "myRole": "HOST",
  "participants": [...],
  "pendingRequests": [...]
}
```

---

### `error`
Sent when an action is invalid or unauthorized:
```json
{
  "type": "error",
  "code": "FORBIDDEN",
  "message": "You do not have permission to perform this action."
}
```
Error codes: `INVALID_MESSAGE`, `UNAUTHORIZED`, `FORBIDDEN`, `ROOM_NOT_FOUND`, `NOT_IN_ROOM`, `INVALID_VIDEO`, `INVALID_SEEK_TIME`, `INVALID_ROLE`, `USER_NOT_FOUND`, `REQUEST_NOT_FOUND`.
