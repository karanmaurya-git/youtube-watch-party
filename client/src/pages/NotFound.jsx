import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center p-4 bg-surface-primary space-y-4">
      <h1 className="text-6xl font-extrabold text-brand-400">404</h1>
      <h2 className="text-2xl font-bold text-text-primary">Page Not Found</h2>
      <p className="text-sm text-text-secondary max-w-md">
        The page or room you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-lg shadow-md transition-all"
      >
        Back to Home
      </Link>
    </div>
  );
};
