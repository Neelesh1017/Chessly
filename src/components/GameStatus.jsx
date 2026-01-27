import React from 'react';

function GameStatus({ game, isThinking, materialDiff }) {
  const getStatusInfo = () => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'Black' : 'White';
        return {
          text: `Checkmate! ${winner} wins!`,
          icon: '🎉',
          color: 'from-green-600 to-emerald-700'
        };
      }
      if (game.isDraw()) {
        return {
          text: 'Draw!',
          icon: '🤝',
          color: 'from-blue-600 to-cyan-700'
        };
      }
      return {
        text: 'Game Over',
        icon: '🏁',
        color: 'from-gray-600 to-slate-700'
      };
    }

    if (game.inCheck()) {
      return {
        text: 'Check!',
        icon: '⚠️',
        color: 'from-red-600 to-rose-700'
      };
    }

    if (isThinking) {
      return {
        text: 'AI is thinking...',
        icon: '🤔',
        color: 'from-purple-600 to-indigo-700'
      };
    }

    const currentPlayer = game.turn() === 'w' ? 'White' : 'Black';
    const icon = game.turn() === 'w' ? '⚪' : '⚫';
    return {
      text: `${currentPlayer} to move`,
      icon: icon,
      color: 'from-amber-600 to-orange-700'
    };
  };

  const status = getStatusInfo();

  return (
    <div className={`bg-gradient-to-r ${status.color} p-6 rounded-2xl shadow-2xl border-2 border-white/20 relative overflow-hidden`}>
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-pulse">{status.icon}</span>
          <p className="text-2xl font-bold text-white">{status.text}</p>
        </div>

        {materialDiff !== undefined && materialDiff !== 0 && !game.isGameOver() && (
          <div className="mt-2 bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-2 animate-bounce-slow">
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Material:
            </span>
            <span className={`font-black text-lg ${materialDiff > 0 ? 'text-green-300' : 'text-red-300'}`}>
              {materialDiff > 0 ? `White +${materialDiff}` : `Black +${Math.abs(materialDiff)}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameStatus;