import { useEffect, useRef } from 'react';

function MoveHistory({ moves, currentIndex }) {
  const scrollRef = useRef(null);

  // Auto-scroll to current move
  useEffect(() => {
    if (scrollRef.current) {
      const activeMove = scrollRef.current.querySelector('.bg-amber-600');
      if (activeMove) {
        activeMove.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentIndex]);

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl border-2 border-slate-700/50 shadow-lg h-[400px] flex flex-col">
      <h3 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent mb-3 pb-3 border-b-2 border-slate-700">
        📜 Move History
      </h3>

      <div ref={scrollRef} className="overflow-y-auto flex-1 space-y-1 pr-2 scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-slate-700">
        {moves.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-600 italic">No moves yet</p>
          </div>
        ) : (
          moves.map((move, index) => {
            const isCurrentMove = index === currentIndex - 1;
            const moveNumber = Math.floor(index / 2) + 1;

            return (
              <div
                key={index}
                className={`py-2 px-3 rounded-lg transition-all ${isCurrentMove
                    ? 'bg-amber-600 text-white shadow-md scale-105'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  }`}
              >
                <span className="font-mono opacity-70 mr-3 text-sm">
                  {moveNumber}.
                </span>
                <span className="font-semibold">{move.split(': ')[1]}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default MoveHistory;