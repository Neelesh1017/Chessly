function HistoryControls({ currentIndex, totalMoves, onNavigate, disabled }) {
  const NavigationButton = ({ onClick, isDisabled, children, label }) => (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={label}
      className="px-5 py-3 bg-gradient-to-br from-slate-700 to-slate-800 text-amber-100 rounded-xl hover:from-slate-600 hover:to-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-all hover:scale-105 shadow-md border border-slate-600/50"
    >
      {children}
    </button>
  );

  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex === totalMoves - 1;

  return (
    <div className="flex justify-center items-center gap-3 bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border-2 border-slate-700/50 shadow-lg">
      <NavigationButton
        onClick={() => onNavigate('start')}
        isDisabled={disabled || isAtStart}
        label="Go to start"
      >
        ⏮️
      </NavigationButton>

      <NavigationButton
        onClick={() => onNavigate('prev')}
        isDisabled={disabled || isAtStart}
        label="Previous move"
      >
        ◀️
      </NavigationButton>

      <div className="px-6 py-2 bg-slate-900/50 rounded-lg border border-slate-700">
        <span className="text-amber-300 font-mono font-bold text-lg">
          Move {Math.floor(currentIndex / 2) + 1}
        </span>
      </div>

      <NavigationButton
        onClick={() => onNavigate('next')}
        isDisabled={disabled || isAtEnd}
        label="Next move"
      >
        ▶️
      </NavigationButton>

      <NavigationButton
        onClick={() => onNavigate('end')}
        isDisabled={disabled || isAtEnd}
        label="Go to current"
      >
        ⏭️
      </NavigationButton>
    </div>
  );
}

export default HistoryControls;