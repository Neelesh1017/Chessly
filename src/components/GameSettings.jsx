import { DIFFICULTIES } from '../constants/gameConstants';

function GameSettings({ gameMode, setGameMode, playerColor, setPlayerColor, aiLevel, setAiLevel, onStart }) {
  return (
    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-10 rounded-3xl border-4 border-amber-600/50 shadow-2xl max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent mb-2">
          ⚙️ Game Setup
        </h2>
        <p className="text-slate-400">Configure your chess experience</p>
      </div>

      <div className="space-y-8">
        {/* Game Mode Selection */}
        <div>
          <label className="block text-amber-200 font-bold mb-4 text-lg">
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setGameMode('human')}
              className={`py-4 px-6 rounded-xl font-semibold transition-all transform hover:scale-105 ${gameMode === 'human'
                  ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-xl scale-105 border-2 border-amber-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-slate-600'
                }`}
            >
              Player vs Player
            </button>
            <button
              onClick={() => setGameMode('ai')}
              className={`py-4 px-6 rounded-xl font-semibold transition-all transform hover:scale-105 ${gameMode === 'ai'
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl scale-105 border-2 border-purple-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-slate-600'
                }`}
            >
              Player vs AI
            </button>
          </div>
        </div>

        {/* AI Settings (only show when AI mode is selected) */}
        {gameMode === 'ai' && (
          <div className="space-y-6">
            {/* Color Selection */}
            <div>
              <label className="block text-amber-200 font-bold mb-4 text-lg">
                🎨 Your Color
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPlayerColor('w')}
                  className={`py-4 px-6 rounded-xl font-semibold transition-all transform hover:scale-105 ${playerColor === 'w'
                      ? 'bg-gradient-to-br from-gray-100 to-gray-300 text-slate-900 shadow-xl scale-105 border-2 border-amber-400'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-slate-600'
                    }`}
                >
                  ⚪ White
                </button>
                <button
                  onClick={() => setPlayerColor('b')}
                  className={`py-4 px-6 rounded-xl font-semibold transition-all transform hover:scale-105 ${playerColor === 'b'
                      ? 'bg-gradient-to-br from-slate-900 to-black text-amber-100 shadow-xl scale-105 border-2 border-amber-400'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-2 border-slate-600'
                    }`}
                >
                  ⚫ Black
                </button>
              </div>
            </div>

            {/* Difficulty Slider */}
            <div>
              <label className="block text-amber-200 font-bold mb-4 text-lg">
                🎯 AI Difficulty:{' '}
                <span className="text-amber-400">
                  {DIFFICULTIES[aiLevel] || `Level ${aiLevel}`}
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={aiLevel}
                onChange={(e) => setAiLevel(Number(e.target.value))}
                className="w-full h-4 bg-slate-900 rounded-lg cursor-pointer accent-amber-600 border-2 border-slate-700"
              />
              <div className="flex justify-between text-sm text-slate-500 mt-2 px-1">
                <span>🐣 Easy</span>
                <span>🔥 Hard</span>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={onStart}
          className="w-full py-5 px-6 rounded-xl font-bold text-xl bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-500 hover:to-emerald-600 transition-all transform hover:scale-105 shadow-2xl border-2 border-green-400/50"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}

export default GameSettings;