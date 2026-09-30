import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import express from 'express';
import WebSocket from 'ws';

import { createWsTicket } from '../src/utils/wsTickets.js';
import { setupWebSocketServer } from '../src/websocket/WebSocketServer.js';
import { roomManager } from '../src/websocket/RoomManager.js';

test('Multi-Client Real-Time WebSocket Integration Tests', async (t) => {
  let server;
  let port;

  // Setup test HTTP & WS server
  await new Promise((resolve) => {
    const app = express();
    server = http.createServer(app);
    setupWebSocketServer(server);
    server.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });

  const wsUrl = `ws://localhost:${port}`;

  // Helper to establish authenticated WS connection for test user
  const connectUser = async (userId, username) => {
    const ticket = createWsTicket({ _id: userId, username });
    const client = new WebSocket(`${wsUrl}?ticket=${ticket}`);
    await new Promise((res, rej) => {
      client.on('open', res);
      client.on('error', rej);
    });
    return client;
  };

  // Setup Room
  const roomId = '507f1f77bcf86cd799439011';
  const roomCode = 'WSLIVE';
  const hostId = 'user_host';
  const participantId = 'user_part';

  roomManager.createRoom(roomId, roomCode, hostId, 'dQw4w9WgXcQ');

  let wsHost;
  let wsPart;

  await t.test('Establish WebSocket connections for HOST and PARTICIPANT', async () => {
    wsHost = await connectUser(hostId, 'HostKaran');
    wsPart = await connectUser(participantId, 'GuestAlex');

    assert.ok(wsHost, 'Host socket connected');
    assert.ok(wsPart, 'Participant socket connected');
  });

  await t.test('Join Room & Receive sync_state', async () => {
    const hostMsgPromise = new Promise((res) => {
      wsHost.once('message', (raw) => res(JSON.parse(raw)));
    });

    wsHost.send(JSON.stringify({ type: 'join_room', roomCode }));
    const hostSync = await hostMsgPromise;
    assert.equal(hostSync.type, 'sync_state');
    assert.equal(hostSync.myRole, 'HOST');

    const partMsgPromise = new Promise((res) => {
      wsPart.once('message', (raw) => res(JSON.parse(raw)));
    });

    wsPart.send(JSON.stringify({ type: 'join_room', roomCode }));
    const partSync = await partMsgPromise;
    assert.equal(partSync.type, 'sync_state');
    assert.equal(partSync.myRole, 'PARTICIPANT');
  });

  await t.test('Host Play -> Participant receives Play broadcast', async () => {
    const partPlayPromise = new Promise((res) => {
      const handler = (raw) => {
        const msg = JSON.parse(raw);
        if (msg.type === 'play') {
          wsPart.off('message', handler);
          res(msg);
        }
      };
      wsPart.on('message', handler);
    });

    wsHost.send(JSON.stringify({ type: 'play', roomCode }));
    const playMsg = await partPlayPromise;
    assert.equal(playMsg.type, 'play');
    assert.equal(playMsg.roomCode, roomCode);
  });

  await t.test('Host Seek -> Participant receives Seek broadcast', async () => {
    const partSeekPromise = new Promise((res) => {
      const handler = (raw) => {
        const msg = JSON.parse(raw);
        if (msg.type === 'seek') {
          wsPart.off('message', handler);
          res(msg);
        }
      };
      wsPart.on('message', handler);
    });

    wsHost.send(JSON.stringify({ type: 'seek', roomCode, time: 150 }));
    const seekMsg = await partSeekPromise;
    assert.equal(seekMsg.type, 'seek');
    assert.equal(seekMsg.time, 150);
  });

  await t.test('Participant direct Play attempt -> Backend rejects with FORBIDDEN', async () => {
    const partErrorPromise = new Promise((res) => {
      const handler = (raw) => {
        const msg = JSON.parse(raw);
        if (msg.type === 'error') {
          wsPart.off('message', handler);
          res(msg);
        }
      };
      wsPart.on('message', handler);
    });

    wsPart.send(JSON.stringify({ type: 'play', roomCode }));
    const errObj = await partErrorPromise;
    assert.equal(errObj.type, 'error');
    assert.equal(errObj.code, 'FORBIDDEN');
  });

  await t.test('Participant Control Request -> Host approves -> Executed', async () => {
    const hostReqPromise = new Promise((res) => {
      const handler = (raw) => {
        const msg = JSON.parse(raw);
        if (msg.type === 'control_request') {
          wsHost.off('message', handler);
          res(msg);
        }
      };
      wsHost.on('message', handler);
    });

    wsPart.send(
      JSON.stringify({
        type: 'control_request',
        roomCode,
        action: 'seek',
        payload: { time: 300 },
      })
    );

    const reqObj = await hostReqPromise;
    assert.equal(reqObj.type, 'control_request');
    assert.equal(reqObj.request.action, 'seek');

    // Host approves request
    wsHost.send(
      JSON.stringify({
        type: 'approve_request',
        roomCode,
        requestId: reqObj.request.requestId,
      })
    );
  });

  await t.test('Malformed JSON message -> Error response without crashing server', async () => {
    const errorPromise = new Promise((res) => {
      const handler = (raw) => {
        const msg = JSON.parse(raw);
        if (msg.type === 'error') {
          wsPart.off('message', handler);
          res(msg);
        }
      };
      wsPart.on('message', handler);
    });

    wsPart.send('THIS IS NOT VALID JSON{{{');
    const errObj = await errorPromise;
    assert.equal(errObj.type, 'error');
    assert.equal(errObj.code, 'INVALID_MESSAGE');
  });

  // Cleanup
  t.after(() => {
    if (wsHost) wsHost.close();
    if (wsPart) wsPart.close();
    if (server) server.close();
  });
});
