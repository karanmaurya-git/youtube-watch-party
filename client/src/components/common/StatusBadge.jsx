import React from 'react';

export const StatusBadge = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case 'connected':
        return 'bg-status-connected/20 text-status-connected border-status-connected/30';
      case 'connecting':
      case 'reconnecting':
        return 'bg-status-connecting/20 text-status-connecting border-status-connecting/30 animate-pulse';
      case 'disconnected':
      default:
        return 'bg-status-disconnected/20 text-status-disconnected border-status-disconnected/30';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'connected':
        return 'Live Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getColors()}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          status === 'connected'
            ? 'bg-status-connected'
            : status === 'connecting' || status === 'reconnecting'
            ? 'bg-status-connecting animate-ping'
            : 'bg-status-disconnected'
        }`}
      />
      {getLabel()}
    </div>
  );
};
