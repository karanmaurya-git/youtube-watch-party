import React from 'react';
import { useRoom } from '../../context/RoomContext';

export const RequestPanel = () => {
  const { pendingRequests, canControl, sendApproveRequest, sendRejectRequest } = useRoom();

  if (!canControl || pendingRequests.length === 0) return null;

  return (
    <div className="bg-surface-secondary border border-amber-500/30 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <span>✋ Pending Control Requests</span>
          <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full">
            {pendingRequests.length}
          </span>
        </h3>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {pendingRequests.map((req) => (
          <div
            key={req.requestId}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-tertiary border border-surface-elevated text-xs"
          >
            <div className="space-y-0.5">
              <p className="font-semibold text-text-primary">
                {req.requesterName} <span className="text-text-secondary font-normal">requested</span>{' '}
                <span className="font-mono text-brand-300 uppercase">{req.action}</span>
              </p>
              {req.payload && req.payload.time !== undefined && (
                <p className="text-text-muted">Target time: {Math.floor(req.payload.time)}s</p>
              )}
              {req.payload && req.payload.videoId && (
                <p className="text-text-muted font-mono">Video: {req.payload.videoId}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => sendApproveRequest(req.requestId)}
                className="px-3 py-1.5 font-bold bg-green-600/30 hover:bg-green-600/50 text-green-300 border border-green-500/40 rounded transition-all"
              >
                Approve
              </button>
              <button
                onClick={() => sendRejectRequest(req.requestId)}
                className="px-3 py-1.5 font-bold bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded transition-all"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
