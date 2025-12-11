import { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const ChessGame = () => {
  // Game State
  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState([new Chess().fen()]); // Stores all board states
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0); // Tracks current view
  const [moveLog, setMoveLog] = useState([]);
  
  // Settings State
  const [gameMode, setGameMode] = useState('human'); // 'human' or 'ai'
  const [aiLevel, setAiLevel] = useState(5); // 1-20
  const [playerColor, setPlayerColor] = useState('w'); // 'w' or 'b'
  const [isThinking, setIsThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  
  const stockfishRef = useRef(null);

  // --- THEME CONFIGURATION ---
  const woodTheme = {
    pageBg: "bg-[#272522]", // Espresso
    container: "max-w-6xl mx-auto font-serif",
    heading: "text-4xl font-bold text-center text-[#e8d0aa] mb-8 tracking-wider",
    panelBg: "bg-[#302b28] border-2 border-[#5c4d3c] shadow-2xl rounded-sm",
    textMain: "text-[#d4c4b5]",
    textHighlight: "text-[#e8a87c]",
    btnPrimary: "bg-[#8b5a2b] hover:bg-[#a66d35] text-[#f0d9b5] border-b-4 border-[#5e3c1d] active:border-b-0 active:translate-y-1",
    btnSecondary: "bg-[#4a4238] hover:bg-[#5c5346] text-[#c0b4a5]",
    btnActive: "bg-[#8b5a2b] text-[#f0d9b5] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]",
    boardDark: '#b58863',
    boardLight: '#f0d9b5',
  };

  // --- ENGINE INITIALIZATION (CORS FIX) ---
  useEffect(() => {
    if (typeof window !== 'undefined' && !stockfishRef.current) {
      const STOCKFISH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';
      
      fetch(STOCKFISH_URL)
        .then(res => res.text())
        .then(text => {
          const blob = new Blob([text], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          stockfishRef.current = new Worker(workerUrl);
          stockfishRef.current.postMessage('uci');
        })
        .catch(err => console.error('Stockfish failed to load:', err));
    }

    return () => {
      if (stockfishRef.current) stockfishRef.current.terminate();
    };
  }, []);

  // --- AI LOGIC (OPTIMIZED) ---
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
            const moveResult = game.move({
              from: move.substring(0, 2),
              to: move.substring(2, 4),
              promotion: move.length > 4 ? move[4] : 'q'
            });

            if (moveResult) {
              const newFen = game.fen();
              setGame(new Chess(newFen));
              const moveNotation = `${game.turn() === 'w' ? 'Black' : 'White'}: ${moveResult.san}`;
              setMoveLog(prev => [...prev, moveNotation]);
              
              // Update History
              setHistory(prev => {
                const newHistory = [...prev, newFen];
                setCurrentMoveIndex(newHistory.length - 1);
                return newHistory;
              });
            }
          } catch (error) {
            console.error('Invalid AI move:', error);
          }
        }
        
        setIsThinking(false);
        stockfishRef.current.removeEventListener('message', handleMessage);
      }
    };

    stockfishRef.current.addEventListener('message', handleMessage);
    
    // DIFFICULTY LOGIC
    let depth = 1;
    if (aiLevel >= 16) depth = 12;
    else if (aiLevel >= 12) depth = 8;
    else if (aiLevel >= 8) depth = 5;
    else if (aiLevel >= 4) depth = 3;
    
    // Skill Level (0-20)
    const skillLevel = Math.max(0, aiLevel - 1);
    stockfishRef.current.postMessage(`setoption name Skill Level value ${skillLevel}`);
    
    // For very low levels, reduce thinking time to minimum to force "rash" decisions
    if (aiLevel <= 3) {
      stockfishRef.current.postMessage('setoption name Minimum Thinking Time value 0');
    }

    stockfishRef.current.postMessage(`position fen ${currentFen}`);
    
    // Time limiting: Cap calculation time based on level (250ms to 1s)
    const maxTime = Math.min(250 + (aiLevel * 40), 1000); 
    stockfishRef.current.postMessage(`go depth ${depth} movetime ${maxTime}`);

  }, [game, aiLevel, isThinking]);

  // --- TRIGGER AI MOVE ---
  useEffect(() => {
    if (gameMode === 'ai' && !showSettings && game.turn() !== playerColor && !game.isGameOver() && !isThinking) {
      // 50ms delay is enough for UI to update, making it feel instant
      const timer = setTimeout(() => {
        makeAIMove();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [game, gameMode, playerColor, showSettings, makeAIMove, isThinking]);

  // --- HUMAN MOVE ---
  const onDrop = useCallback((sourceSquare, targetSquare) => {
    // 1. Block moves if reviewing history
    if (currentMoveIndex !== history.length - 1) return false;
    
    // 2. Block moves if AI turn or Thinking
    if (gameMode === 'ai' && game.turn() !== playerColor) return false;
    if (isThinking) return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move) {
        const newFen = game.fen();
        setGame(new Chess(newFen));
        const moveNotation = `${game.turn() === 'w' ? 'Black' : 'White'}: ${move.san}`;
        setMoveLog(prev => [...prev, moveNotation]);
        
        // Update History
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

  // --- GAME HELPERS ---
  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setHistory([newGame.fen()]);
    setCurrentMoveIndex(0);
    setMoveLog([]);
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

  const getGameStatus = () => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) return `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`;
      if (game.isDraw()) return "Draw!";
      return "Game Over!";
    }
    if (game.inCheck()) return "Check!";
    if (isThinking) return "AI is thinking...";
    return `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
  };

  const getDifficultyLabel = (level) => {
    if (level <= 3) return 'Beginner';
    if (level <= 7) return 'Intermediate';
    if (level <= 12) return 'Advanced';
    if (level <= 16) return 'Expert';
    return 'Master';
  };

  // --- RENDER ---
  return (
    <div className={`min-h-screen ${woodTheme.pageBg} p-4 md:p-8`}>
      <div className={woodTheme.container}>
        <h1 className={woodTheme.heading}>
          Grandmaster Chess {gameMode === 'ai' ? '- vs Stockfish' : ''}
        </h1>

        {showSettings ? (
          <div className={`${woodTheme.panelBg} p-8 mb-8`}>
            <h2 className="text-2xl font-bold text-[#e8d0aa] mb-6 border-b border-[#5c4d3c] pb-2">Game Setup</h2>
            
            <div className="space-y-6">
              {/* Game Mode */}
              <div>
                <label className={`block ${woodTheme.textMain} font-bold mb-3`}>Select Mode</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setGameMode('human')}
                    className={`flex-1 py-3 px-6 rounded font-semibold transition-all ${
                      gameMode === 'human' ? woodTheme.btnActive : woodTheme.btnSecondary
                    }`}
                  >
                    Human vs Human
                  </button>
                  <button
                    onClick={() => setGameMode('ai')}
                    className={`flex-1 py-3 px-6 rounded font-semibold transition-all ${
                      gameMode === 'ai' ? woodTheme.btnActive : woodTheme.btnSecondary
                    }`}
                  >
                    Human vs AI
                  </button>
                </div>
              </div>

              {/* AI Controls */}
              {gameMode === 'ai' && (
                <>
                  <div>
                    <label className={`block ${woodTheme.textMain} font-bold mb-3`}>Choose Side</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setPlayerColor('w')}
                        className={`flex-1 py-3 px-6 rounded font-semibold transition-all ${
                          playerColor === 'w' 
                            ? "bg-[#f0d9b5] text-[#2c241b] shadow-lg" 
                            : woodTheme.btnSecondary
                        }`}
                      >
                        White
                      </button>
                      <button
                        onClick={() => setPlayerColor('b')}
                        className={`flex-1 py-3 px-6 rounded font-semibold transition-all ${
                          playerColor === 'b' 
                            ? "bg-[#2c241b] text-[#f0d9b5] border border-[#5c4d3c]" 
                            : woodTheme.btnSecondary
                        }`}
                      >
                        Black
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block ${woodTheme.textMain} font-bold mb-3`}>
                      Difficulty: <span className="text-[#e8a87c]">{getDifficultyLabel(aiLevel)}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={aiLevel}
                      onChange={(e) => setAiLevel(parseInt(e.target.value))}
                      className="w-full h-3 bg-[#1e1b18] rounded-lg appearance-none cursor-pointer accent-[#8b5a2b]"
                    />
                  </div>
                </>
              )}

              <button
                onClick={startGame}
                className={`w-full py-4 px-6 rounded font-bold transition-all text-xl ${woodTheme.btnPrimary} mt-4`}
              >
                Start Game
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 max-w-2xl mx-auto">
              <div className={`${woodTheme.panelBg} p-4 mb-4 text-center`}>
                <p className={`text-2xl font-bold ${game.inCheck() ? 'text-red-400' : woodTheme.textHighlight}`}>
                  {getGameStatus()}
                </p>
              </div>

              <div className="rounded-sm overflow-hidden shadow-2xl border-4 border-[#4a3c31]">
                <Chessboard 
                  position={history[currentMoveIndex]} // View historical or current position
                  onPieceDrop={onDrop}
                  boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                  customDarkSquareStyle={{ backgroundColor: woodTheme.boardDark }}
                  customLightSquareStyle={{ backgroundColor: woodTheme.boardLight }}
                  animationDuration={200}
                />
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-center gap-2 mt-4 bg-[#302b28] p-3 rounded shadow-inner border border-[#5c4d3c]">
                <button 
                  onClick={() => navigateHistory('start')}
                  disabled={currentMoveIndex === 0}
                  className="px-4 py-2 bg-[#4a4238] text-[#f0d9b5] rounded hover:bg-[#5c5346] disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  title="Start"
                >
                  «
                </button>
                <button 
                  onClick={() => navigateHistory('prev')}
                  disabled={currentMoveIndex === 0}
                  className="px-4 py-2 bg-[#4a4238] text-[#f0d9b5] rounded hover:bg-[#5c5346] disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  title="Previous"
                >
                  ‹
                </button>
                
                <span className="px-4 py-2 text-[#d4c4b5] font-mono flex items-center min-w-[100px] justify-center">
                   Move {Math.floor(currentMoveIndex / 2) + 1}
                </span>

                <button 
                  onClick={() => navigateHistory('next')}
                  disabled={currentMoveIndex === history.length - 1}
                  className="px-4 py-2 bg-[#4a4238] text-[#f0d9b5] rounded hover:bg-[#5c5346] disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  title="Next"
                >
                  ›
                </button>
                <button 
                  onClick={() => navigateHistory('end')}
                  disabled={currentMoveIndex === history.length - 1}
                  className="px-4 py-2 bg-[#4a4238] text-[#f0d9b5] rounded hover:bg-[#5c5346] disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                  title="Current"
                >
                  »
                </button>
              </div>

              <div className="flex gap-4 mt-6">
                <button 
                  onClick={resetGame}
                  className={`flex-1 py-3 px-6 rounded font-bold transition-all ${woodTheme.btnPrimary}`}
                >
                  New Game
                </button>
                <button 
                  onClick={() => setShowSettings(true)}
                  className={`flex-1 py-3 px-6 rounded font-bold transition-all ${woodTheme.btnSecondary}`}
                >
                  Settings
                </button>
              </div>
            </div>

            <div className="lg:w-80">
              <div className={`${woodTheme.panelBg} p-6 h-full`}>
                <h2 className={`text-xl font-bold ${woodTheme.textHighlight} mb-4 border-b border-[#5c4d3c] pb-2`}>
                  Move History
                </h2>
                <div className="bg-[#1e1b18] rounded p-4 h-[400px] overflow-y-auto font-mono text-sm border border-[#5c4d3c]">
                  {moveLog.map((move, index) => (
                    <div 
                      key={index} 
                      className={`py-1 border-b border-[#302b28] flex ${index === currentMoveIndex - 1 ? 'bg-[#3b352f] text-[#e8a87c]' : 'text-[#a89f91]'}`}
                    >
                      <span className="w-8 opacity-50">{Math.floor(index / 2) + 1}.</span>
                      <span>{move.split(': ')[1]}</span>
                    </div>
                  ))}
                  {moveLog.length === 0 && <span className="text-gray-600 italic">Game start</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessGame;