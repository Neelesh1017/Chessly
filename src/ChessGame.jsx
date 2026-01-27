import { useState, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

import GameStatus from './components/GameStatus';
import CapturedPieces from './components/CapturedPieces';
import MoveHistory from './components/MoveHistory';
import HistoryControls from './components/HistoryControls';
import GameSettings from './components/GameSettings';

import useStockfish from './hooks/useStockfish';
import { DIFFICULTIES, PIECE_VALUES } from './constants/gameConstants';

function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [positionHistory, setPositionHistory] = useState([new Chess().fen()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [moveList, setMoveList] = useState([]);
  const [capturedPieces, setCapturedPieces] = useState({
    white: [],
    black: []
  });

  const [gameMode, setGameMode] = useState('human');
  const [aiLevel, setAiLevel] = useState(5);
  const [playerColor, setPlayerColor] = useState('w');
  const [isThinking, setIsThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const stockfishRef = useStockfish();

  // Calculate material advantage
  const calculateAdvantage = () => {
    const whiteScore = capturedPieces.white.reduce((acc, piece) => acc + PIECE_VALUES[piece], 0);
    const blackScore = capturedPieces.black.reduce((acc, piece) => acc + PIECE_VALUES[piece], 0);
    return whiteScore - blackScore;
  };

  const materialDiff = calculateAdvantage();

  const makeAIMove = useCallback(() => {
    if (!stockfishRef.current || isThinking) return;

    setIsThinking(true);
    const currentPosition = game.fen();

    const handleAIResponse = (event) => {
      const message = event.data;

      if (message.startsWith('bestmove')) {
        const moveMatch = message.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);

        if (moveMatch) {
          const aiMove = moveMatch[1];
          const fromSquare = aiMove.substring(0, 2);
          const toSquare = aiMove.substring(2, 4);
          const promotion = aiMove.length > 4 ? aiMove[4] : 'q';

          try {
            const capturedPiece = game.get(toSquare);
            const moveResult = game.move({
              from: fromSquare,
              to: toSquare,
              promotion: promotion
            });

            if (moveResult) {
              // FIX: Use moveResult.color to determine who captured
              if (capturedPiece) {
                const capturingColor = moveResult.color === 'w' ? 'white' : 'black';
                setCapturedPieces(prev => ({
                  ...prev,
                  [capturingColor]: [...prev[capturingColor], capturedPiece.type]
                }));
              }

              const newPosition = game.fen();
              setGame(new Chess(newPosition));

              const playerName = moveResult.color === 'w' ? 'White' : 'Black';
              const moveNotation = `${playerName}: ${moveResult.san}`;
              setMoveList(prev => [...prev, moveNotation]);

              setPositionHistory(prev => {
                const newHistory = [...prev, newPosition];
                setCurrentIndex(newHistory.length - 1);
                return newHistory;
              });
            }
          } catch (error) {
            console.error('Invalid AI move:', error);
          }
        }

        setIsThinking(false);
        stockfishRef.current.removeEventListener('message', handleAIResponse);
      }
    };

    stockfishRef.current.addEventListener('message', handleAIResponse);

    const searchDepth = Math.max(1, Math.min(12, Math.floor(aiLevel / 2)));
    const skillLevel = Math.max(0, aiLevel - 1);

    stockfishRef.current.postMessage(`setoption name Skill Level value ${skillLevel}`);

    if (aiLevel <= 3) {
      stockfishRef.current.postMessage('setoption name Minimum Thinking Time value 0');
    }

    stockfishRef.current.postMessage(`position fen ${currentPosition}`);
    const thinkingTime = Math.min(250 + (aiLevel * 40), 1000);
    stockfishRef.current.postMessage(`go depth ${searchDepth} movetime ${thinkingTime}`);
  }, [game, aiLevel, isThinking, stockfishRef]);

  useEffect(() => {
    const shouldAIMove =
      gameMode === 'ai' &&
      !showSettings &&
      game.turn() !== playerColor &&
      !game.isGameOver() &&
      !isThinking;

    if (shouldAIMove) {
      const timer = setTimeout(() => makeAIMove(), 50);
      return () => clearTimeout(timer);
    }
  }, [game, gameMode, playerColor, showSettings, makeAIMove, isThinking]);

  const handlePieceDrop = useCallback((fromSquare, toSquare) => {
    if (currentIndex !== positionHistory.length - 1) return false;
    if (gameMode === 'ai' && game.turn() !== playerColor) return false;
    if (isThinking) return false;

    try {
      const capturedPiece = game.get(toSquare);
      const moveResult = game.move({
        from: fromSquare,
        to: toSquare,
        promotion: 'q'
      });

      if (moveResult) {
        // FIX: Use moveResult.color to determine who captured
        if (capturedPiece) {
          const capturingColor = moveResult.color === 'w' ? 'white' : 'black';
          setCapturedPieces(prev => ({
            ...prev,
            [capturingColor]: [...prev[capturingColor], capturedPiece.type]
          }));
        }

        const newPosition = game.fen();
        setGame(new Chess(newPosition));

        const playerName = moveResult.color === 'w' ? 'White' : 'Black';
        const moveNotation = `${playerName}: ${moveResult.san}`;
        setMoveList(prev => [...prev, moveNotation]);

        const newHistory = [...positionHistory, newPosition];
        setPositionHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);

        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }, [game, positionHistory, currentIndex, gameMode, playerColor, isThinking]);

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setPositionHistory([newGame.fen()]);
    setCurrentIndex(0);
    setMoveList([]);
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
    if (direction === 'start') {
      setCurrentIndex(0);
    } else if (direction === 'prev') {
      setCurrentIndex(current => Math.max(0, current - 1));
    } else if (direction === 'next') {
      setCurrentIndex(current => Math.min(positionHistory.length - 1, current + 1));
    } else if (direction === 'end') {
      setCurrentIndex(positionHistory.length - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent mb-2 tracking-wide">
            Chessly
          </h1>
          {gameMode === 'ai' && !showSettings && (
            <p className="text-slate-400 text-lg">
              Playing against {DIFFICULTIES[aiLevel]} AI
            </p>
          )}
        </div>

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
              <GameStatus 
                game={game} 
                isThinking={isThinking} 
                materialDiff={materialDiff} 
              />

              <div className="mt-6 rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-600/50 ring-4 ring-slate-800">
                <Chessboard
                  position={positionHistory[currentIndex]}
                  onPieceDrop={handlePieceDrop}
                  boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                  customDarkSquareStyle={{ backgroundColor: '#b58863' }}
                  customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
                  animationDuration={200}
                />
              </div>

              <div className="mt-6">
                <HistoryControls
                  currentIndex={currentIndex}
                  totalMoves={positionHistory.length}
                  onNavigate={navigateHistory}
                  disabled={isThinking}
                />
              </div>

              <div className="mt-6">
                <button
                  onClick={resetGame}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-500 hover:to-rose-600 transition-all transform hover:scale-105 shadow-xl border-2 border-red-400/50"
                >
                  🔄 New Game
                </button>
              </div>
            </div>

            <div className="lg:w-80 space-y-4">
              <CapturedPieces captured={capturedPieces.white} color="white" />
              <CapturedPieces captured={capturedPieces.black} color="black" />
              <MoveHistory moves={moveList} currentIndex={currentIndex} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChessGame;