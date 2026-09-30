import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRoom } from '../context/RoomContext';

export const JoinRoom = () => {
  const { roomCode } = useParams();
  const { isAuthenticated } = useAuth();
  const { joinRoom } = useRoom();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    const upperCode = roomCode.toUpperCase();

    if (!isAuthenticated) {
      navigate(`/login?redirect=/room/${upperCode}`);
      return;
    }

    // Direct redirect to Room view
    navigate(`/room/${upperCode}`);
  }, [roomCode, isAuthenticated, navigate]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-surface-primary text-text-secondary">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Joining Watch Party Room...</p>
      </div>
    </div>
  );
};
