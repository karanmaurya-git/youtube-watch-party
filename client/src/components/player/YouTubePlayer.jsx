import React, { useEffect, useRef, useState } from 'react';

export const YouTubePlayer = ({
  videoId,
  playState,
  currentTime,
  canControl,
  onLocalPlay,
  onLocalPause,
  onLocalSeek,
}) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const isApiReadyRef = useRef(false);
  const isRemoteActionRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // 1. Dynamically Load YouTube IFrame API Script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isApiReadyRef.current = true;
      initPlayer();
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      isApiReadyRef.current = true;
      initPlayer();
    };
  }, []);

  // Initialize YT.Player
  const initPlayer = () => {
    if (!containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId || 'dQw4w9WgXcQ',
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event) => {
          setIsReady(true);
          console.log('🎬 YouTube IFrame Player Ready');
        },
        onStateChange: handlePlayerStateChange,
      },
    });
  };

  // 2. Handle State Changes (Distinguish Local User Click vs Remote WebSocket Sync)
  const handlePlayerStateChange = (event) => {
    // If state change was triggered by remote WebSocket sync, IGNORE to prevent infinite event loop!
    if (isRemoteActionRef.current) {
      console.log('🛡️ Remote sync event absorbed by player (preventing loop)');
      isRemoteActionRef.current = false;
      return;
    }

    // Only authorized users (HOST/MODERATOR) generate outbound WS events from local clicks
    if (!canControl) return;

    const YT_STATE = window.YT.PlayerState;

    if (event.data === YT_STATE.PLAYING) {
      if (onLocalPlay) onLocalPlay();
    } else if (event.data === YT_STATE.PAUSED) {
      if (onLocalPause) onLocalPause();
    }
  };

  // 3. React to Remote Video ID Changes
  useEffect(() => {
    if (!isReady || !playerRef.current || !videoId) return;

    try {
      const currentVideoData = playerRef.current.getVideoData?.();
      if (!currentVideoData || currentVideoData.video_id !== videoId) {
        isRemoteActionRef.current = true;
        playerRef.current.loadVideoById(videoId);
      }
    } catch (e) {
      console.error('Error updating videoId:', e);
    }
  }, [videoId, isReady]);

  // 4. React to Remote Play/Pause Changes
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      const state = playerRef.current.getPlayerState?.();
      const YT_STATE = window.YT ? window.YT.PlayerState : null;
      if (!YT_STATE) return;

      if (playState === 'playing' && state !== YT_STATE.PLAYING) {
        isRemoteActionRef.current = true;
        playerRef.current.playVideo();
      } else if (playState === 'paused' && state !== YT_STATE.PAUSED) {
        isRemoteActionRef.current = true;
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      console.error('Error syncing playState:', e);
    }
  }, [playState, isReady]);

  // 5. React to Remote Seek Changes (if drift > 1.5s)
  useEffect(() => {
    if (!isReady || !playerRef.current || currentTime === undefined || currentTime === null) return;

    try {
      const playerTime = playerRef.current.getCurrentTime?.() || 0;
      const drift = Math.abs(playerTime - currentTime);

      if (drift > 1.5) {
        console.log(`⏩ Correcting drift of ${drift.toFixed(2)}s to ${currentTime.toFixed(2)}s`);
        isRemoteActionRef.current = true;
        playerRef.current.seekTo(currentTime, true);
      }
    } catch (e) {
      console.error('Error syncing currentTime:', e);
    }
  }, [currentTime, isReady]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-surface-elevated">
      <div ref={containerRef} className="w-full h-full" />
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-secondary text-text-secondary">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Loading YouTube Player...</p>
        </div>
      )}
    </div>
  );
};
