import { PIECE_VALUES, PIECE_SYMBOLS } from '../constants/gameConstants';

function CapturedPieces({ captured, color }) {
  // Calculate total value of captured pieces
  const calculateTotal = () => {
    let total = 0;
    for (let piece of captured) {
      total = total + PIECE_VALUES[piece];
    }
    return total;
  };

  const totalValue = calculateTotal();

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border-2 border-slate-700/50 shadow-lg">
      {/* Header with color and points */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
          {color === 'white' ? '⚪ White' : '⚫ Black'} Captures
        </span>
        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm font-bold border border-amber-500/30">
          +{totalValue}
        </span>
      </div>

      {/* Show captured pieces */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {captured.length === 0 ? (
          <span className="text-slate-600 italic text-sm">No captures yet</span>
        ) : (
          captured.map((piece, index) => (
            <span
              key={index}
              className="text-3xl transform hover:scale-125 transition-transform"
            >
              {PIECE_SYMBOLS[piece]}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

export default CapturedPieces;