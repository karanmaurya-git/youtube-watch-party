# 🏗️ YouTube Watch Party — System Architecture Document

## 1. System Overview

The YouTube Watch Party application uses a hybrid REST + WebSocket architecture:

```
Browser Client (React + Vite)
 │
 ├── HTTPS REST API ────► Express.js Backend ────► MongoDB Atlas (Persistent Data)
 │
 └── Native WSS ────────► Node.js ws Server ────► In-Memory RoomManager (Live State)
```

- **REST API**: Handles stateless operations such as user registration, login, profile inspection, WebSocket ticket issuance, room creation, and persistent room lookup.
- **WebSocket Protocol**: Handles real-time, low-latency state synchronization including video playback actions (`play`, `pause`, `seek`, `change_video`), participant joins/leaves, role assignments, and control requests.

---

## 2. Separate Room Identifiers (`roomId` vs `roomCode`)

To ensure clean separation of concerns and database efficiency:

1. **`roomId`**: MongoDB `ObjectId` (e.g. `507f1f77bcf86cd799439011`). Internal identifier used by the backend database and in-memory Map lookup. Never exposed in user-facing URLs.
2. **`roomCode`**: Human-readable 6-character uppercase alphanumeric code (e.g. `ABC123`). Used in public URLs (`/room/ABC123`), room links, and UI input fields.

When a client requests `/room/ABC123`, the backend resolves `roomCode` to the internal `roomId`.

---

## 3. WebSocket Authentication Flow

Standard WebSockets in browsers do not support custom headers during the HTTP upgrade handshake. To avoid putting long-lived JWTs in WebSocket query parameters:

```
Client                                  Server
  │                                       │
  ├─── 1. POST /api/auth/ws-ticket ──────►│ (Authenticated with JWT header)
  │◄── 2. Returns short-lived ticket ─────┤ (Valid for 30s, single-use)
  │                                       │
  ├─── 3. new WebSocket(ws://...?ticket=t)►│
  │                                       ├── Validate ticket on HTTP upgrade
  │                                       ├── Resolve userId & username server-side
  │                                       └── Destroy ticket (prevent replay)
  │◄── 4. Connection Established ─────────┤
```

---

## 4. In-Memory Live State vs Persistent MongoDB Storage

### Persistent Storage (MongoDB Atlas)
- **Users**: Credentials, hashed passwords (`bcryptjs`), timestamps.
- **Rooms**: `roomCode`, `hostId`, default `videoId`, status (`active`/`closed`).

### In-Memory Live State (`RoomManager`)
- **`Room` Instances**: Live `playState`, `currentTime`, `lastUpdated` timestamp, active `Participant` list, pending `ControlRequest` queue.
- **`Participant` Instances**: `userId`, `username`, `role` (`HOST`, `MODERATOR`, `PARTICIPANT`), and live `WebSocket` socket reference.

> **Trade-off / Limitation**: In-memory state ensures sub-10ms broadcast latency. If the Node server restarts, active live room playback positions are reset to default DB metadata.

---

## 5. Server-Side Role-Based Access Control (RBAC)

Hiding buttons in UI is cosmetic only. Every incoming WebSocket message is parsed and checked by `Room.hasPermission(userId, action)` before execution:

| Action | HOST | MODERATOR | PARTICIPANT |
|---|:---:|:---:|:---:|
| `play` / `pause` / `seek` | ✅ | ✅ | ❌ (can request) |
| `change_video` | ✅ | ✅ | ❌ (can request) |
| `assign_role` | ✅ | ❌ | ❌ |
| `remove_participant` | ✅ | ❌ | ❌ |
| `transfer_host` | ✅ | ❌ | ❌ |
| `approve_request` / `reject_request` | ✅ | ✅ | ❌ |
| `control_request` | ❌ | ❌ | ✅ |

Unauthorized calls immediately return an error event:
```json
{
  "type": "error",
  "code": "FORBIDDEN",
  "message": "You do not have permission to perform 'play'."
}
```

---

## 6. Event Loop Prevention Strategy

To prevent YouTube API player events from triggering infinite broadcast loops:

```
Local User Click
  └─► Player executes action
  └─► Sets isRemoteActionRef = false
  └─► Triggers WebSocket send to server

Remote WebSocket Message Received
  └─► Sets isRemoteActionRef = true
  └─► Player programmatically updates state (e.g. player.playVideo())
  └─► YouTube onStateChange event fires
  └─► Handler detects isRemoteActionRef === true → ABSORTED! (No outbound WS message)
```

---

## 7. Future Scalability Architecture (Horizontal Scaling)

The MVP uses a single-node in-memory `RoomManager`. To scale horizontally across multiple Node.js instances:

```
Load Balancer (AWS ALB / NGINX)
      │
  ┌───┴───────────┬───────────────┐
  ▼               ▼               ▼
Node Server 1   Node Server 2   Node Server 3
  └───────────────┼───────────────┘
                  ▼
          Redis Pub/Sub Adapter
```

Using Redis Pub/Sub, when Server 1 receives a playback action for Room `ABC123`, it publishes the event to Redis, which broadcasts it to Server 2 and 3, ensuring all clients receive updates regardless of which server instance holds their socket connection.
