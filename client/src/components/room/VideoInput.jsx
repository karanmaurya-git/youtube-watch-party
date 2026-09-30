import React, { useState } from 'react';
import { useRoom } from '../../context/RoomContext';
import { extractYouTubeId } from '../../utils/youtube';

export const VideoInput = () => {
  const { canControl, sendChangeVideo, sendControlRequest } = useRoom();
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!inputUrl.trim()) return;

    const extractedId = extractYouTubeId(inputUrl);
    if (!extractedId) {
      setError('Invalid YouTube Video URL or ID.');
      return;
    }

    if (canControl) {
      sendChangeVideo(extractedId);
      setInputUrl('');
    } else {
      sendControlRequest('change_video', { videoId: extractedId });
      setInputUrl('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-secondary border border-surface-elevated rounded-xl p-4 shadow-lg space-y-2">
      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
        Change Video
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Paste YouTube URL or Video ID (e.g. https://youtu.be/...)"
          className="flex-1 bg-surface-primary border border-surface-elevated rounded-lg px-3.5 py-2 text-sm text-text-primary placeholder-text-muted focus:border-brand-500 transition-colors"
        />
        <button
          type="submit"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            canControl
              ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20'
              : 'bg-surface-tertiary hover:bg-surface-elevated text-brand-300 border border-brand-500/30'
          }`}
        >
          {canControl ? 'Load Video' : 'Request Change'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </form>
  );
};
