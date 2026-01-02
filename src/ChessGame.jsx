import { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const DIFFICULTIES = {
  1: 'Beginner',
  5: 'Intermediate',
  10: 'Advanced',
  15: 'Expert',
  20: 'Master'
};

function GameStatus({ game, isThinking }) {
  const getStatusMessage = () => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        return `🎉 Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`;
      }
      if (game.isDraw()) return '🤝 Draw!';
      return '🏁 Game Over';
    }
    if (game.inCheck()) return '⚠️ Check!';
    if (isThinking) return '🤔 AI is thinking...';
    return `${game.turn() === 'w' ? '⚪ White' : '⚫ Black'} to move`;
  };

  return (
    <div className="bg-gradient-to-r from-amber-900 to-amber-800 p-4 rounded-lg shadow-lg border border-amber-700">
      <p className="text-xl font-bold text-amber-50 text-center">
        {getStatusMessage()}
      </p>
    </div>
  );
}

function CapturedPieces({ captured, color }) {
  const pieceSymbols = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
  
  const totalValue = captured.reduce((sum, piece) => sum + PIECE_VALUES[piece], 0);

  return (
    <div className="bg-stone-800 p-3 rounded-lg border border-stone-700">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-300 font-bold">
          {color === 'white' ? '⚪ White' : '⚫ Black'} Captured
        </span>
        <span className="text-amber-400 text-sm">+{totalValue}</span>
      </div>
      <div className="flex flex-wrap gap-1 min-h-[32px]">
        {captured.map((piece, idx) => (
          <span key={idx} className="text-2xl opacity-80">
            {pieceSymbols[piece]}
          </span>
        ))}
      </div>
    </div>
  );
}

function MoveHistory({ moves, currentIndex }) {
  return (
    <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 h-96 overflow-y-auto">
      <h3 className="text-lg font-bold text-amber-300 mb-3 border-b border-stone-700 pb-2">
        Move History
      </h3>
      <div className="space-y-1">
        {moves.map((move, idx) => (
          <div
            key={idx}
            className={`py-1 px-2 rounded transition-colors ${
              idx === currentIndex - 1
                ? 'bg-amber-900 text-amber-100'
                : 'text-stone-400 hover:bg-stone-700'
            }`}
          >
            <span className="opacity-60 mr-2">{Math.floor(idx / 2) + 1}.</span>
            {move.split(': ')[1]}
          </div>
        ))}
        {moves.length === 0 && (
          <p className="text-stone-600 italic text-center py-4">No moves yet</p>
        )}
      </div>
    </div>
  );
}

function HistoryControls({ currentIndex, historyLength, onNavigate, disabled }) {
  const Button = ({ onClick, disabled, children, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="px-4 py-2 bg-stone-700 text-amber-100 rounded hover:bg-stone-600 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-all hover:scale-105 active:scale-95"
    >
      {children}
    </button>
  );

  return (
    <div className="flex justify-center gap-2 bg-stone-800 p-3 rounded-lg border border-stone-700">
      <Button onClick={() => onNavigate('start')} disabled={disabled || currentIndex === 0} title="Start">
        «
      </Button>
      <Button onClick={() => onNavigate('prev')} disabled={disabled || currentIndex === 0} title="Previous">
        ‹
      </Button>
      <span className="px-4 py-2 text-amber-300 font-mono flex items-center min-w-[100px] justify-center">
        Move {Math.floor(currentIndex / 2) + 1}
      </span>
      <Button onClick={() => onNavigate('next')} disabled={disabled || currentIndex === historyLength - 1} title="Next">
        ›
      </Button>
      <Button onClick={() => onNavigate('end')} disabled={disabled || currentIndex === historyLength - 1} title="Current">
        »
      </Button>
    </div>
  );
}

function GameSettings({ gameMode, setGameMode, playerColor, setPlayerColor, aiLevel, setAiLevel, onStart }) {
  return (
    <div className="bg-stone-800 p-8 rounded-lg border-2 border-amber-700 shadow-2xl max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-amber-300 mb-6 text-center">
        Game Setup
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-amber-200 font-bold mb-3">Game Mode</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setGameMode('human')}
              className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                gameMode === 'human'
                  ? 'bg-amber-700 text-white shadow-lg scale-105'
                  : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
              }`}
            >
              👥 Human vs Human
            </button>
            <button
              onClick={() => setGameMode('ai')}
              className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                gameMode === 'ai'
                  ? 'bg-amber-700 text-white shadow-lg scale-105'
                  : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
              }`}
            >
              🤖 Human vs AI
            </button>
          </div>
        </div>

        {gameMode === 'ai' && (
          <>
            <div>
              <label className="block text-amber-200 font-bold mb-3">Your Color</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPlayerColor('w')}
                  className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                    playerColor === 'w'
                      ? 'bg-amber-100 text-stone-900 shadow-lg scale-105'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  ⚪ White
                </button>
                <button
                  onClick={() => setPlayerColor('b')}
                  className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                    playerColor === 'b'
                      ? 'bg-stone-900 text-amber-100 border-2 border-amber-700 scale-105'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  ⚫ Black
                </button>
              </div>
            </div>

            <div>
              <label className="block text-amber-200 font-bold mb-3">
                AI Difficulty: <span className="text-amber-400">{DIFFICULTIES[aiLevel] || 'Custom'}</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={aiLevel}
                onChange={(e) => setAiLevel(parseInt(e.target.value))}
                className="w-full h-3 bg-stone-900 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>Easy</span>
                <span>Hard</span>
              </div>
            </div>
          </>
        )}

        <button
          onClick={onStart}
          className="w-full py-4 px-6 rounded-lg font-bold text-xl bg-amber-600 text-white hover:bg-amber-500 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
        >
          Start Game 🎮
        </button>
      </div>
    </div>
  );
}

function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState([new Chess().fen()]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moveLog, setMoveLog] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  
  const [gameMode, setGameMode] = useState('human');
  const [aiLevel, setAiLevel] = useState(5);
  const [playerColor, setPlayerColor] = useState('w');
  const [isThinking, setIsThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  
  const stockfishRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !stockfishRef.current) {
      fetch('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')
        .then(res => res.text())
        .then(text => {
          const blob = new Blob([text], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          stockfishRef.current = new Worker(workerUrl);
          stockfishRef.current.postMessage('uci');
        })
        .catch(err => console.error('Failed to load AI:', err));
    }

    return () => {
      if (stockfishRef.current) stockfishRef.current.terminate();
    };
  }, []);

  const makeAIMove = useCallback(() => {
    if (!stockfishRef.current || isThinking) return;

    setIsThinking(true);
    const currentFen = game.fen();

    const handleMessage = (event) => {
      const message = event.data;
      
      if (message.startsWith('bestmove')) {
        const moveMatch = message.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (moveMatch) {
          const move = moveMatch[1];
          try {
            const targetSquare = game.get(move.substring(2, 4));
            const moveResult = game.move({
              from: move.substring(0, 2),
              to: move.substring(2, 4),
              promotion: move.length > 4 ? move[4] : 'q'
            });

            if (moveResult) {
              if (targetSquare) {
                setCapturedPieces(prev => ({
                  ...prev,
                  [game.turn() === 'w' ? 'white' : 'black']: [
                    ...prev[game.turn() === 'w' ? 'white' : 'black'],
                    targetSquare.type
                  ]
                }));
              }

              const newFen = game.fen();
              setGame(new Chess(newFen));
              const moveNotation = `${game.turn() === 'w' ? 'Black' : 'White'}: ${moveResult.san}`;
              setMoveLog(prev => [...prev, moveNotation]);
              
              setHistory(prev => {
                const newHistory = [...prev, newFen];
                setCurrentMoveIndex(newHistory.length - 1);
                return newHistory;
              });
            }
          } catch (error) {
            console.error('Invalid AI move');
          }
        }
        
        setIsThinking(false);
        stockfishRef.current.removeEventListener('message', handleMessage);
      }
    };

    stockfishRef.current.addEventListener('message', handleMessage);
    
    let depth = Math.max(1, Math.min(12, Math.floor(aiLevel / 2)));
    const skillLevel = Math.max(0, aiLevel - 1);
    stockfishRef.current.postMessage(`setoption name Skill Level value ${skillLevel}`);
    
    if (aiLevel <= 3) {
      stockfishRef.current.postMessage('setoption name Minimum Thinking Time value 0');
    }

    stockfishRef.current.postMessage(`position fen ${currentFen}`);
    const maxTime = Math.min(250 + (aiLevel * 40), 1000);
    stockfishRef.current.postMessage(`go depth ${depth} movetime ${maxTime}`);
  }, [game, aiLevel, isThinking]);

  useEffect(() => {
    if (gameMode === 'ai' && !showSettings && game.turn() !== playerColor && !game.isGameOver() && !isThinking) {
      const timer = setTimeout(() => makeAIMove(), 50);
      return () => clearTimeout(timer);
    }
  }, [game, gameMode, playerColor, showSettings, makeAIMove, isThinking]);

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    if (currentMoveIndex !== history.length - 1) return false;
    if (gameMode === 'ai' && game.turn() !== playerColor) return false;
    if (isThinking) return false;

    try {
      const capturedPiece = game.get(targetSquare);
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move) {
        if (capturedPiece) {
          setCapturedPieces(prev => ({
            ...prev,
            [game.turn() === 'w' ? 'white' : 'black']: [
              ...prev[game.turn() === 'w' ? 'white' : 'black'],
              capturedPiece.type
            ]
          }));
        }

        const newFen = game.fen();
        setGame(new Chess(newFen));
        const moveNotation = `${game.turn() === 'w' ? 'Black' : 'White'}: ${move.san}`;
        setMoveLog(prev => [...prev, moveNotation]);
        
        const newHistory = [...history, newFen];
        setHistory(newHistory);
        setCurrentMoveIndex(newHistory.length - 1);
        
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }, [game, history, currentMoveIndex, gameMode, playerColor, isThinking]);

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setHistory([newGame.fen()]);
    setCurrentMoveIndex(0);
    setMoveLog([]);
    setCapturedPieces({ white: [], black: [] });
    setShowSettings(true);
    setIsThinking(false);
  };

  const startGame = () => {
    setShowSettings(false);
    if (gameMode === 'ai' && playerColor === 'b') {
      setTimeout(() => makeAIMove(), 100);
    }
  };

  const navigateHistory = (direction) => {
    if (direction === 'start') setCurrentMoveIndex(0);
    if (direction === 'prev') setCurrentMoveIndex(curr => Math.max(0, curr - 1));
    if (direction === 'next') setCurrentMoveIndex(curr => Math.min(history.length - 1, curr + 1));
    if (direction === 'end') setCurrentMoveIndex(history.length - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-amber-300 mb-8 tracking-wide drop-shadow-lg">
          ♟️ Chess Master {gameMode === 'ai' && '🤖'}
        </h1>

        {showSettings ? (
          <GameSettings
            gameMode={gameMode}
            setGameMode={setGameMode}
            playerColor={playerColor}
            setPlayerColor={setPlayerColor}
            aiLevel={aiLevel}
            setAiLevel={setAiLevel}
            onStart={startGame}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 max-w-3xl mx-auto w-full">
              <GameStatus game={game} isThinking={isThinking} />

              <div className="mt-4 rounded-lg overflow-hidden shadow-2xl border-4 border-amber-900">
                <Chessboard
                  position={history[currentMoveIndex]}
                  onPieceDrop={onDrop}
                  boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                  customDarkSquareStyle={{ backgroundColor: '#b58863' }}
                  customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
                  animationDuration={200}
                />
              </div>

              <div className="mt-4">
                <HistoryControls
                  currentIndex={currentMoveIndex}
                  historyLength={history.length}
                  onNavigate={navigateHistory}
                  disabled={isThinking}
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={resetGame}
                  className="flex-1 py-3 px-6 rounded-lg font-bold bg-red-700 text-white hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  🔄 New Game
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 py-3 px-6 rounded-lg font-bold bg-stone-700 text-amber-100 hover:bg-stone-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>

            <div className="lg:w-80 space-y-4">
              <CapturedPieces captured={capturedPieces.white} color="white" />
              <CapturedPieces captured={capturedPieces.black} color="black" />
              <MoveHistory moves={moveLog} currentIndex={currentMoveIndex} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChessGame;
