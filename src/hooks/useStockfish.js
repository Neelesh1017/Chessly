import { useEffect, useRef } from 'react';

function useStockfish() {
  const stockfishWorker = useRef(null);

  // Load the AI engine when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && !stockfishWorker.current) {
      fetch('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')
        .then(response => response.text())
        .then(scriptText => {
          const blob = new Blob([scriptText], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          stockfishWorker.current = new Worker(workerUrl);
          stockfishWorker.current.postMessage('uci');
        })
        .catch(error => {
          console.error('Failed to load chess AI:', error);
        });
    }

    // Cleanup when component unmounts
    return () => {
      if (stockfishWorker.current) {
        stockfishWorker.current.terminate();
      }
    };
  }, []);

  return stockfishWorker;
}

export default useStockfish;