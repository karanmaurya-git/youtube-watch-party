# 🎬 YouTube Watch Party

A full-stack, real-time web application that allows multiple participants to watch YouTube videos together in synchronized harmony.

---

## 🌐 View Live

[![View Live](https://img.shields.io/badge/🎬_YouTube_Watch_Party-View_Live-success?style=for-the-badge)](https://youtube-watch-party-ecru-seven.vercel.app/)

[![Backend Server](https://img.shields.io/badge/🖥️_Backend-Server-blue?style=for-the-badge)](https://youtube-watch-party-server-4zja.onrender.com/)

---

## 🌟 Features

- **Real-Time Video Synchronization**: All participants see the exact same video, play/pause state, seek position, and video changes instantaneously.
- **Room-Based Architecture**: Create unique rooms, join via human-readable room codes (e.g. `ABC123`), or share direct room URLs.
- **Role-Based Access Control (RBAC)**:
  - **HOST**: Room creator. Full playback control, role assignment (`MODERATOR`), participant removal, and host transfer.
  - **MODERATOR**: Assigned by Host. Full playback control (`play`, `pause`, `seek`, `change_video`).
  - **PARTICIPANT**: Default joiner role. Watch-only; can send control requests to Host/Moderators for approval.
- **Strict Backend Permission Enforcement**: All RBAC checks are executed on the server. Buttons are hidden on the frontend for UX, but unauthorized WebSocket commands are rejected with `FORBIDDEN` error codes.
- **Single-Use WebSocket Ticket Authentication**: Secure browser-compatible authentication mechanism prevents exposing long-lived JWTs in WebSocket URLs.
- **Participant Control Requests**: Participants can request `play`, `pause`, `seek`, or `change_video`. Host/Moderator receives a real-time banner to approve or reject.
- **Native Browser WebSocket & Node.js `ws`**: Built using standard WebSockets without Socket.IO.
- **Loop Prevention**: Player event handlers differentiate local user clicks from remote WebSocket broadcasts, preventing infinite sync loops.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, React Router v7, Axios, Native Browser WebSocket API
- **Backend**: Node.js, Express 5, `ws` (Node.js WebSocket package), Helmet, CORS, JWT, bcryptjs
- **Database**: MongoDB Atlas via Mongoose 9
- **Deployment Ready**: Frontend configured for Vercel, Backend for Render, Database on MongoDB Atlas

---

## 📁 Repository Structure

```
youtube-watch-party/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # Player, Room, Participants, Requests, Header
│   │   ├── context/             # AuthContext, RoomContext, WebSocketContext
│   │   ├── pages/               # Home, Login, Register, JoinRoom, Room, NotFound
│   │   ├── services/            # api.js (Axios), websocket.js (Native WebSocket)
│   │   └── utils/               # youtube.js URL parser
│   └── package.json
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── config/              # env.js, db.js
│   │   ├── controllers/         # authController, roomController
│   │   ├── middleware/          # auth, errorHandler, validation
│   │   ├── models/              # User, Room
│   │   ├── routes/              # authRoutes, roomRoutes
│   │   ├── utils/               # jwt, wsTickets, generateRoomCode, youtube
│   │   └── websocket/           # WebSocketServer, WebSocketMessageHandler, RoomManager, Room, Participant
│   ├── tests/                   # Integration & unit test suite
│   └── package.json
├── docs/                        # Architecture & Interview Docs
│   ├── ARCHITECTURE.md
│   ├── WEBSOCKET_PROTOCOL.md
│   ├── INTERVIEW_GUIDE.md
│   └── REQUIREMENTS_CHECKLIST.md
├── README.md
└── package.json
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites

- Node.js (v18+)
- MongoDB connection string (local or MongoDB Atlas)

### 2. Environment Variables Setup

#### Server `.env` (`server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/youtube-watch-party?retryWrites=true&w=majority
JWT_SECRET=your-strong-random-secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

#### Client `.env` (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

### 3. Install & Run

```bash
# Install all dependencies
npm run install:all

# Run backend server (from server directory)
cd server && npm run dev

# Run frontend client (from client directory in another terminal)
cd client && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

The server includes unit and multi-client integration tests covering authentication, room lifecycle, RBAC enforcement, and WebSocket real-time synchronization.

```bash
cd server
npm test
```

---

## 🌐 Production Deployment

- **Frontend (Vercel)**:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variables: `VITE_API_URL`, `VITE_WS_URL` (use `wss://`)
- **Backend (Render)**:
  - Environment: Node.js Web Service
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Environment Variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV=production`

---

## 📚 Documentation Links

- 📖 [Architecture Documentation](docs/ARCHITECTURE.md)
- 🔌 [WebSocket Message Protocol](docs/WEBSOCKET_PROTOCOL.md)
- 🎤 [Interview Guide & Talking Points](docs/INTERVIEW_GUIDE.md)
- ✅ [Official Requirements Checklist](docs/REQUIREMENTS_CHECKLIST.md)

---

### 👨‍💻 Author

**Karan Maurya**

- GitHub: [@karanaurya-git](https://github.com/karanaurya-git)
- LinkedIn: [karan-maurya-4260b6293/](https://linkedin.com/in/karan-maurya-4260b6293/)

### 📄 License

MIT License.
