import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { RoomProvider } from './context/RoomContext';
import { Header } from './components/common/Header';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { JoinRoom } from './pages/JoinRoom';
import { Room } from './pages/Room';
import { NotFound } from './pages/NotFound';

// Protected Route Guard Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary text-text-secondary">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <RoomProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-surface-primary text-text-primary">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/join/:roomCode"
                    element={
                      <ProtectedRoute>
                        <JoinRoom />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/room/:roomCode"
                    element={
                      <ProtectedRoute>
                        <Room />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </Router>
        </RoomProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
