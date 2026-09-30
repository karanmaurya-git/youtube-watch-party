import React from 'react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';

export const ParticipantList = () => {
  const { participants, isHost, sendAssignRole, sendRemoveParticipant, sendTransferHost } = useRoom();
  const { user } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'HOST':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MODERATOR':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'PARTICIPANT':
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="bg-surface-secondary border border-surface-elevated rounded-xl p-4 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-surface-elevated mb-3">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <span>👥 Participants</span>
          <span className="bg-brand-600/30 text-brand-300 text-xs px-2 py-0.5 rounded-full border border-brand-500/20">
            {participants.length}
          </span>
        </h3>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-80 pr-1">
        {participants.map((p) => {
          const isMe = user && p.userId === user.id;

          return (
            <div
              key={p.userId}
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface-tertiary border border-surface-elevated/60 hover:border-surface-elevated transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-800 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                  {p.username.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate flex items-center gap-1.5">
                    <span>{p.username}</span>
                    {isMe && <span className="text-[10px] text-brand-300 bg-brand-500/20 px-1.5 py-0.5 rounded">(You)</span>}
                  </p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-0.5 ${getRoleBadge(p.role)}`}>
                    {p.role}
                  </span>
                </div>
              </div>

              {/* Host Action Controls */}
              {isHost && !isMe && (
                <div className="flex items-center gap-1 shrink-0">
                  {p.role === 'PARTICIPANT' && (
                    <button
                      onClick={() => sendAssignRole(p.userId, 'MODERATOR')}
                      title="Promote to Moderator"
                      className="px-2 py-1 text-xs bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-500/40 rounded transition-all"
                    >
                      +Mod
                    </button>
                  )}
                  {p.role === 'MODERATOR' && (
                    <button
                      onClick={() => sendAssignRole(p.userId, 'PARTICIPANT')}
                      title="Demote to Participant"
                      className="px-2 py-1 text-xs bg-gray-600/30 text-gray-300 hover:bg-gray-600/50 border border-gray-500/40 rounded transition-all"
                    >
                      -Mod
                    </button>
                  )}
                  <button
                    onClick={() => sendTransferHost(p.userId)}
                    title="Transfer Host Role"
                    className="px-2 py-1 text-xs bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 border border-amber-500/40 rounded transition-all"
                  >
                    👑
                  </button>
                  <button
                    onClick={() => sendRemoveParticipant(p.userId)}
                    title="Remove from Room"
                    className="px-2 py-1 text-xs bg-red-600/30 text-red-300 hover:bg-red-600/50 border border-red-500/40 rounded transition-all"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
