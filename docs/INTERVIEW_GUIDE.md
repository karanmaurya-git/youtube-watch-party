# 🎤 YouTube Watch Party — Technical Interview Guide

This guide provides concise, interview-ready answers to common technical questions about this project's architecture, design decisions, and real-time implementation.

---

## 1. Core Architecture Questions

### Q: Why React and Vite for the frontend?
> **Answer**: React's component model and state hooks (`useContext`, `useCallback`, `useEffect`) allow clean separation between UI components and complex real-time WebSocket state. Vite provides instant HMR during development and ESBuild-powered production bundling in under a second.

### Q: Why Node.js and Express?
> **Answer**: Node.js operates on an event-driven, non-blocking I/O loop, which makes it ideal for handling hundreds of concurrent WebSocket connections and light HTTP REST endpoints efficiently on a single process.

### Q: Why MongoDB and Mongoose?
> **Answer**: MongoDB's document model fits user accounts and room metadata naturally. Mongoose provides schema validation, middleware hooks, and ObjectId management while keeping persistent data separate from in-memory live room connections.

---

## 2. Real-Time & WebSocket Questions

### Q: Why native WebSockets (`ws` package) instead of Socket.IO?
> **Answer**: Socket.IO adds custom protocol overhead, fallback polling layers, and auto-reconnection magic that obscures how WebSockets actually function. Using browser-native `new WebSocket()` and Node's `ws` package demonstrates direct, raw WebSocket protocol handling, custom frame message routing, and explicit authentication ticket verification.

### Q: How does WebSocket authentication work without putting long-lived JWTs in URLs?
> **Answer**: Browser WebSocket API does not allow custom HTTP headers during connection initiation. Passing a long-lived JWT in the URL query string is insecure because URLs are logged in server access logs and browser history. Instead, the client requests a short-lived (~30s), single-use WebSocket ticket via an authenticated REST endpoint (`POST /api/auth/ws-ticket`). The server verifies the ticket on the WebSocket HTTP upgrade request, resolves identity server-side, and immediately consumes/destroys the ticket.

### Q: How does playback synchronization work (`sync_state`)?
> **Answer**: When a client joins or reconnects, the server calculates the current elapsed video time (`currentTime + (Date.now() - lastUpdated)`) if `playState === 'playing'`, and sends a complete `sync_state` snapshot. The client loads the video, seeks to the calculated target time, and matches the play/pause state.

### Q: How do you prevent event loops between YouTube player events and WebSocket broadcasts?
> **Answer**: When a remote WebSocket event arrives, a component ref (`isRemoteActionRef`) is set to `true` before calling player methods (`player.playVideo()`). The YouTube player's `onStateChange` listener checks this ref. If `isRemoteActionRef` is `true`, it absorbs the event without emitting an outbound WebSocket command back to the server.

---

## 3. Security & RBAC Questions

### Q: Why is backend RBAC enforcement necessary if buttons are hidden on the frontend?
> **Answer**: Frontend button hiding is purely cosmetic for user experience. Any user could open DevTools or a script and send raw WebSocket frames (`{"type":"play"}`). The server MUST independently verify the user's role in memory (`Room.hasPermission(userId, action)`) before executing any state change.

### Q: What happens when a participant tries to pause or play?
> **Answer**: The server rejects the action with a `{ type: "error", code: "FORBIDDEN" }` payload. Instead, participants can use the `control_request` feature to send a pending request to the Host/Moderators for approval.

---

## 4. Scalability & Trade-offs

### Q: What is stored in MongoDB vs Memory?
> **Answer**: MongoDB stores persistent entities (`Users`, `Rooms` metadata). In-memory `RoomManager` stores active live sockets, current playback state, participant roles, and pending requests.

### Q: What happens if the server restarts?
> **Answer**: Because live state is stored in memory for sub-10ms latency, a server restart clears active live rooms. Clients automatically reconnect, and if the room exists in MongoDB, the live room state is re-initialized.

### Q: How would you scale this application horizontally across multiple servers?
> **Answer**: Currently, state is stored in single-node memory. To scale horizontally, we would place a Load Balancer in front of multiple Node.js instances and introduce a **Redis Pub/Sub** message broker. When Server 1 receives a play action, it publishes to Redis, which broadcasts the event to all other server nodes so connected clients on any instance receive the state update.
