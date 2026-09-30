import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthContext';

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const { ws, isConnected, connectWebSocket } = useWebSocket();
  const { user } = useAuth();

  const [currentRoomCode, setCurrentRoomCode] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ');
  const [playState, setPlayState] = useState('paused'); // 'playing' | 'paused'
  const [currentTime, setCurrentTime] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [myRole, setMyRole] = useState('PARTICIPANT');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState(null);

  // Clear notice after 5s
  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 5000);
  };

  // Clear error after 6s
  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // Bind WebSocket Event Handlers
  useEffect(() => {
    if (!ws) return;

    const unsubSyncState = ws.on('sync_state', (data) => {
      console.log('🔄 Received sync_state:', data);
      setRoomId(data.roomId);
      setCurrentRoomCode(data.roomCode);
      setHostId(data.hostId);
      setVideoId(data.videoId || 'dQw4w9WgXcQ');
      setPlayState(data.playState || 'paused');
      setCurrentTime(data.currentTime || 0);
      setParticipants(data.participants || []);
      setMyRole(data.myRole || 'PARTICIPANT');
      setPendingRequests(data.pendingRequests || []);
    });

    const unsubPlay = ws.on('play', (data) => {
      console.log('▶️ Remote play:', data);
      setPlayState('playing');
      if (data.currentTime !== undefined) {
        setCurrentTime(data.currentTime);
      }
    });

    const unsubPause = ws.on('pause', (data) => {
      console.log('⏸️ Remote pause:', data);
      setPlayState('paused');
      if (data.currentTime !== undefined) {
        setCurrentTime(data.currentTime);
      }
    });

    const unsubSeek = ws.on('seek', (data) => {
      console.log('⏩ Remote seek:', data);
      setCurrentTime(data.time);
      if (data.playState) setPlayState(data.playState);
    });

    const unsubChangeVideo = ws.on('change_video', (data) => {
      console.log('🎬 Remote change_video:', data);
      setVideoId(data.videoId);
      setPlayState('paused');
      setCurrentTime(0);
      setPendingRequests([]);
      showNotice(`Video changed to: ${data.videoId}`);
    });

    const unsubParticipantsUpdated = ws.on('participants_updated', (data) => {
      console.log('👥 Participants updated:', data.participants);
      setParticipants(data.participants);

      // Update myRole if changed
      if (user) {
        const me = data.participants.find((p) => p.userId === user.id);
        if (me) {
          setMyRole(me.role);
        }
      }
    });

    const unsubRoleAssigned = ws.on('role_assigned', (data) => {
      if (user && data.targetUserId === user.id) {
        setMyRole(data.role);
        showNotice(`Your role was updated to ${data.role}`);
      }
    });

    const unsubHostTransferred = ws.on('host_transferred', (data) => {
      setHostId(data.newHostId);
      showNotice(`Host transferred to ${data.newHostUsername}`);
      if (user && data.newHostId === user.id) {
        setMyRole('HOST');
      }
    });

    const unsubControlRequest = ws.on('control_request', (data) => {
      setPendingRequests((prev) => [...prev.filter((r) => r.requestId !== data.request.requestId), data.request]);
      showNotice(`New request from ${data.request.requesterName}: ${data.request.action}`);
    });

    const unsubRequestApproved = ws.on('request_approved', (data) => {
      setPendingRequests((prev) => prev.filter((r) => r.requestId !== data.requestId));
      showNotice(`Request approved by ${data.approvedBy}`);
    });

    const unsubRequestRejected = ws.on('request_rejected', (data) => {
      setPendingRequests((prev) => prev.filter((r) => r.requestId !== data.requestId));
      showNotice(`Request rejected by ${data.rejectedBy}`);
    });

    const unsubParticipantRemoved = ws.on('participant_removed', (data) => {
      showError(data.reason || 'You were removed from the room.');
      leaveRoom();
    });

    const unsubError = ws.on('error', (data) => {
      showError(`[${data.code}] ${data.message}`);
    });

    return () => {
      unsubSyncState();
      unsubPlay();
      unsubPause();
      unsubSeek();
      unsubChangeVideo();
      unsubParticipantsUpdated();
      unsubRoleAssigned();
      unsubHostTransferred();
      unsubControlRequest();
      unsubRequestApproved();
      unsubRequestRejected();
      unsubParticipantRemoved();
      unsubError();
    };
  }, [ws, user]);

  // Outbound Action Commands
  const joinRoom = useCallback(
    async (code) => {
      await connectWebSocket();
      setCurrentRoomCode(code.toUpperCase());
      ws.send({
        type: 'join_room',
        roomCode: code.toUpperCase(),
      });
    },
    [connectWebSocket, ws]
  );

  const leaveRoom = useCallback(() => {
    if (currentRoomCode) {
      ws.send({
        type: 'leave_room',
        roomCode: currentRoomCode,
      });
    }
    setCurrentRoomCode(null);
    setRoomId(null);
    setParticipants([]);
    setPendingRequests([]);
  }, [currentRoomCode, ws]);

  const sendPlay = useCallback(() => {
    if (!currentRoomCode) return;
    ws.send({
      type: 'play',
      roomCode: currentRoomCode,
    });
  }, [currentRoomCode, ws]);

  const sendPause = useCallback(() => {
    if (!currentRoomCode) return;
    ws.send({
      type: 'pause',
      roomCode: currentRoomCode,
    });
  }, [currentRoomCode, ws]);

  const sendSeek = useCallback(
    (time) => {
      if (!currentRoomCode) return;
      ws.send({
        type: 'seek',
        roomCode: currentRoomCode,
        time: Number(time),
      });
    },
    [currentRoomCode, ws]
  );

  const sendChangeVideo = useCallback(
    (videoIdOrUrl) => {
      if (!currentRoomCode) return;
      ws.send({
        type: 'change_video',
        roomCode: currentRoomCode,
        videoId: videoIdOrUrl,
      });
    },
    [currentRoomCode, ws]
  );

  const sendAssignRole = useCallback(
    (targetUserId, role) => {
      if (!currentRoomCode) return;
      ws.send({
        type: 'assign_role',
        roomCode: currentRoomCode,
        targetUserId,
        role,
      });
    },
    [currentRoomCode, ws]
  );

  const sendRemoveParticipant = useCallback(
    (targetUserId) => {
      if (!currentRoomCode) return;
      ws.send({
        type: 'remove_participant',
        roomCode: currentRoomCode,
        targetUserId,
      });
    },
    [currentRoomCode, ws]
  );

  const sendTransferHost = useCallback(
    (targetUserId) => {
      if (!currentRoomCode) return;
      ws.send({
        type: 'transfer_host',
        roomCode: currentRoomCode,
        targetUserId,
      });
    },
    [currentRoomCode, ws]
  );

  const sendControlRequest = useCallback(
    (action, payload) => {
      if (!currentRoomCode) return;
      ws.send({
        type: 'control_request',
        roomCode: currentRoomCode,
        action,
        payload,
      });
      showNotice(`Control request sent: ${action}`);
    },
    [currentRoomCode, ws]
  );

  const sendApproveRequest = useCallback(
    (requestId) => {
      if (!currentRoomCode) return;
      ws.send({
        type: 'approve_request',
        roomCode: currentRoomCode,
        requestId,
      });
    },
    [currentRoomCode, ws]
  );

  const sendRejectRequest = useCallback(
    (requestId) => {
      if (!currentRoomCode) return;
      ws.send({
        type: 'reject_request',
        roomCode: currentRoomCode,
        requestId,
      });
    },
    [currentRoomCode, ws]
  );

  const canControl = myRole === 'HOST' || myRole === 'MODERATOR';
  const isHost = myRole === 'HOST';

  return (
    <RoomContext.Provider
      value={{
        currentRoomCode,
        roomId,
        hostId,
        videoId,
        playState,
        currentTime,
        participants,
        myRole,
        pendingRequests,
        canControl,
        isHost,
        errorMessage,
        noticeMessage,
        joinRoom,
        leaveRoom,
        sendPlay,
        sendPause,
        sendSeek,
        sendChangeVideo,
        sendAssignRole,
        sendRemoveParticipant,
        sendTransferHost,
        sendControlRequest,
        sendApproveRequest,
        sendRejectRequest,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
