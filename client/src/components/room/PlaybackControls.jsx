import React, { useState, useEffect } from 'react';
import { useRoom } from '../../context/RoomContext';

export const PlaybackControls = () => {
  const {
    playState,
    currentTime,
    canControl,
    sendPlay,
    sendPause,
    sendSeek,
    sendControlRequest,
  } = useRoom();

  const [sliderTime, setSliderTime] = useState(currentTime || 0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    if (!isSeeking) {
      setSliderTime(currentTime || 0);
    }
  }, [currentTime, isSeeking]);

  const handlePlayPause = () => {
    if (!canControl) {
      sendControlRequest(playState === 'playing' ? 'pause' : 'play');
      return;
    }

    if (playState === 'playing') {
      sendPause();
    } else {
      sendPlay();
    }
  };

  const handleSliderChange = (e) => {
    setIsSeeking(true);
    setSliderTime(Number(e.target.value));
  };

  const handleSliderRelease = () => {
    setIsSeeking(false);
    if (canControl) {
      sendSeek(sliderTime);
    } else {
      sendControlRequest('seek', { time: sliderTime });
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-surface-secondary border border-surface-elevated rounded-xl p-4 shadow-lg space-y-3">
      {/* Time Slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-text-muted w-12 text-right">
          {formatTime(sliderTime)}
        </span>
        <input
          type="range"
          min="0"
          max="3600"
          step="1"
          value={sliderTime}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          className="w-full accent-brand-500 bg-surface-tertiary h-2 rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
        />
      </div>

      {/* Buttons & Indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayPause}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all shadow-md ${
              canControl
                ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30'
                : 'bg-surface-tertiary text-brand-300 hover:bg-surface-elevated border border-brand-500/30'
            }`}
          >
            {playState === 'playing' ? (
              <>
                <span className="text-base">⏸️</span>
                <span>{canControl ? 'Pause' : 'Request Pause'}</span>
              </>
            ) : (
              <>
                <span className="text-base">▶️</span>
                <span>{canControl ? 'Play' : 'Request Play'}</span>
              </>
            )}
          </button>

          {!canControl && (
            <span className="text-xs text-text-muted bg-surface-tertiary px-2.5 py-1 rounded border border-surface-elevated">
              🔒 Watch-Only (Click to Request)
            </span>
          )}
        </div>

        <div className="text-xs font-medium text-text-secondary bg-surface-tertiary px-3 py-1.5 rounded-lg border border-surface-elevated">
          Status: <span className={playState === 'playing' ? 'text-green-400 font-bold' : 'text-amber-400 font-bold'}>{playState.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
