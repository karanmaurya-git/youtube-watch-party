import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const redirect = query.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirect);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-surface-primary">
      <div className="max-w-md w-full bg-surface-secondary border border-surface-elevated rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-text-primary">Welcome Back</h2>
          <p className="text-xs text-text-secondary">Sign in to join or host YouTube Watch Parties</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-surface-primary border border-surface-elevated rounded-lg px-3.5 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-primary border border-surface-elevated rounded-lg px-3.5 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-brand-600/30 flex justify-center items-center"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-center text-text-secondary">
          Don't have an account?{' '}
          <Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-brand-400 hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
