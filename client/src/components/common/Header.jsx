import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { StatusBadge } from './StatusBadge';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { connectionStatus } = useWebSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-surface-secondary/90 backdrop-blur-md border-b border-surface-elevated/50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            🎬
          </div>
          <span className="bg-gradient-to-r from-white via-gray-100 to-text-secondary bg-clip-text text-transparent">
            YouTube Watch Party
          </span>
        </Link>

        {/* Right Nav / Status */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <StatusBadge status={connectionStatus} />
              <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary bg-surface-tertiary px-3 py-1.5 rounded-lg border border-surface-elevated">
                <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                <span className="font-medium text-text-primary">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:text-white bg-surface-tertiary hover:bg-red-500/20 hover:border-red-500/40 border border-surface-elevated rounded-lg transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="px-4 py-1.5 text-sm font-semibold text-text-primary hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-all shadow-md shadow-brand-600/30"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
