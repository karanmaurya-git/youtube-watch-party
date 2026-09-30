import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { YouTubePlayer } from '../components/player/YouTubePlayer';
import { PlaybackControls } from '../components/room/PlaybackControls';
import { VideoInput } from '../components/room/VideoInput';
import { ParticipantList } from '../components/participants/ParticipantList';
import { RequestPanel } from '../components/requests/RequestPanel';

export const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    currentRoomCode,
    videoId,
    playState,
    currentTime,
    myRole,
    canControl,
    errorMessage,
    noticeMessage,
    joinRoom,
    leaveRoom,
    sendPlay,
    sendPause,
    sendSeek,
  } = useRoom();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/room/${roomCode}`);
      return;
    }

    if (roomCode && currentRoomCode !== roomCode.toUpperCase()) {
      joinRoom(roomCode);
    }
  }, [roomCode, currentRoomCode, isAuthenticated, joinRoom, navigate]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${roomCode.toUpperCase()}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-surface-primary text-text-primary p-4 lg:p-6 space-y-4">
      {/* Toast Banners */}
      {noticeMessage && (
        <div className="fixed top-16 right-4 z-50 bg-brand-600/90 text-white px-4 py-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>🔔</span> {noticeMessage}
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-16 right-4 z-50 bg-red-600/90 text-white px-4 py-2.5 rounded-lg shadow-xl backdrop-blur-md text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      {/* Room Header Toolbar */}
      <div className="bg-surface-secondary border border-surface-elevated rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Room Code</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-extrabold text-brand-300 tracking-wider">
                {roomCode ? roomCode.toUpperCase() : '------'}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 text-xs font-semibold bg-surface-tertiary hover:bg-surface-elevated border border-surface-elevated rounded-md transition-all text-text-secondary hover:text-white"
              >
                {copied ? '✓ Room link copied.' : '📋 Copy Link'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Your Role</span>
            <div>
              <span
                className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded border ${
                  myRole === 'HOST'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : myRole === 'MODERATOR'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}
              >
                {myRole}
              </span>
            </div>
          </div>

          <button
            onClick={handleLeave}
            className="px-4 py-2 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all"
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Grid Layout (Video Left/Top, Sidebar Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column: YouTube Player & Controls (Col span 2) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <YouTubePlayer
            videoId={videoId}
            playState={playState}
            currentTime={currentTime}
            canControl={canControl}
            onLocalPlay={sendPlay}
            onLocalPause={sendPause}
            onLocalSeek={sendSeek}
          />
          <PlaybackControls />
          <VideoInput />
        </div>

        {/* Right Column: Participants & Control Requests Sidebar (Col span 1) */}
        <div className="space-y-4 flex flex-col">
          <RequestPanel />
          <div className="flex-1 min-h-[350px]">
            <ParticipantList />
          </div>
        </div>
      </div>
    </div>
  );
};
