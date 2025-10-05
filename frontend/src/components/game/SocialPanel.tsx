import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';

interface Winner {
  id: string;
  username: string;
  multiplier: number;
  amount: number;
  timestamp: Date;
}

interface SocialPanelProps {
  recentWinners?: Winner[];
}

export const SocialPanel: React.FC<SocialPanelProps> = ({ recentWinners = [] }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bets' | 'system'>('all');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'bets', label: 'Bets' },
    { id: 'system', label: 'System' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Recent Winners Reel */}
      <Card className="p-4">
        <h3 className="font-display text-lg font-bold mb-3">🏆 Recent Winners</h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {recentWinners.length === 0 ? (
            <p className="text-text/60 text-sm text-center py-4">
              No winners yet. Be the first!
            </p>
          ) : (
            recentWinners.map((winner) => (
              <div
                key={winner.id}
                className="flex items-center justify-between p-2 bg-surface/50 rounded-md animate-fade-in"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold">
                      {winner.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{winner.username}</p>
                    <p className="text-xs text-text/60">
                      {winner.multiplier.toFixed(2)}x
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">
                    +{winner.amount.toFixed(2)} TND
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Chat Panel */}
      <Card className="p-4">
        <div className="flex gap-2 mb-3 border-b border-surface pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 py-1 rounded-md text-sm font-medium
                transition-all duration-quick
                ${activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-text/60 hover:text-text hover:bg-surface/50'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 h-[300px] overflow-y-auto">
          {/* Chat messages placeholder */}
          <div className="text-center py-8 text-text/40">
            <p className="text-sm">Chat coming soon</p>
            <p className="text-xs mt-2">Connect with other players in real-time</p>
          </div>
        </div>

        {/* Chat Input */}
        <div className="mt-3 pt-3 border-t border-surface">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              disabled
              className="flex-1 px-3 py-2 bg-surface border border-surface rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-quick disabled:opacity-50"
            />
            <button
              disabled
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-all duration-quick disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
