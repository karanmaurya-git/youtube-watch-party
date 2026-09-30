import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/rooms', { videoUrl: videoUrlInput });
      const { roomCode } = res.data;
      navigate(`/room/${roomCode}`);
    } catch (err) {
      setError(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;

    if (!isAuthenticated) {
      navigate(`/login?redirect=/room/${roomCodeInput.trim().toUpperCase()}`);
      return;
    }

    navigate(`/room/${roomCodeInput.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-surface-primary via-surface-secondary to-surface-primary relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl w-full text-center space-y-8 relative z-10">
        {/* Headline */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider">
            ⚡ Real-Time YouTube Synchronization
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-text-primary tracking-tight leading-tight">
            Watch YouTube Together <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-red-400 bg-clip-text text-transparent">
              In Perfect Sync.
            </span>
          </h1>
          <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto">
            Create a room, share the link, and enjoy synchronized playback, role-based controls, and instant participant requests with friends.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Create Room Card */}
          <div className="bg-surface-secondary/80 border border-surface-elevated rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4 flex flex-col justify-between hover:border-brand-500/50 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center text-xl font-bold border border-brand-500/30">
                ✨
              </div>
              <h3 className="text-xl font-bold text-text-primary">Create a Watch Party</h3>
              <p className="text-xs text-text-secondary">
                Start a new synchronized room as Host. You can paste an initial YouTube video link.
              </p>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-3 pt-2">
              <input
                type="text"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                placeholder="Optional YouTube URL or Video ID"
                className="w-full bg-surface-primary border border-surface-elevated rounded-lg px-3.5 py-2 text-xs text-text-primary placeholder-text-muted focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 font-bold text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Room...' : '🚀 Create Room Now'}
              </button>
            </form>
          </div>

          {/* Join Room Card */}
          <div className="bg-surface-secondary/80 border border-surface-elevated rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4 flex flex-col justify-between hover:border-brand-500/50 transition-all">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-xl font-bold border border-purple-500/30">
                🔑
              </div>
              <h3 className="text-xl font-bold text-text-primary">Join with Room Code</h3>
              <p className="text-xs text-text-secondary">
                Have a 6-character room code from a friend? Enter it below to join instantly.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-3 pt-2">
              <input
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                className="w-full uppercase tracking-widest font-mono text-center bg-surface-primary border border-surface-elevated rounded-lg px-3.5 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!roomCodeInput.trim()}
                className="w-full py-2.5 font-bold text-sm bg-surface-tertiary hover:bg-surface-elevated text-brand-300 border border-brand-500/40 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                ➡️ Join Watch Party
              </button>
            </form>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/30">{error}</p>}
      </div>
    </div>
  );
};
