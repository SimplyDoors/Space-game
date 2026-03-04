import { useGameStore } from '../store';

export function UI() {
  const { score, highScore, isGameOver, isPlaying, startGame, resetGame } = useGameStore();

  const handleTouchStart = (action: string) => {
    if ((window as any).setPlayerInput) {
      if (action === 'left') (window as any).setPlayerInput({ left: true });
      if (action === 'right') (window as any).setPlayerInput({ right: true });
      if (action === 'jump') (window as any).setPlayerInput({ jump: true });
    }
  };

  const handleTouchEnd = (action: string) => {
    if ((window as any).setPlayerInput) {
      if (action === 'left') (window as any).setPlayerInput({ left: false });
      if (action === 'right') (window as any).setPlayerInput({ right: false });
      if (action === 'jump') (window as any).setPlayerInput({ jump: false });
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* HUD */}
      <div className="absolute top-4 left-4 text-white font-mono text-xl drop-shadow-md">
        <div>SCORE: {Math.floor(score)}</div>
        <div className="text-sm opacity-70">HIGH: {highScore}</div>
      </div>

      {/* Start Screen */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              SPACE MARIO
            </h1>
            <p className="mb-8 text-lg opacity-80">Use Arrow Keys or Touch Controls to Move</p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              START MISSION
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 pointer-events-auto">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-4 text-red-500">GAME OVER</h1>
            <p className="mb-4 text-2xl">Final Score: {Math.floor(score)}</p>
            <button
              onClick={() => {
                resetGame();
                startGame();
              }}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      {isPlaying && (
        <div className="absolute bottom-8 left-0 right-0 px-8 flex justify-between pointer-events-auto">
          <div className="flex gap-4">
            <button
              className="w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm active:bg-white/40 flex items-center justify-center"
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={() => handleTouchEnd('left')}
              onMouseDown={() => handleTouchStart('left')}
              onMouseUp={() => handleTouchEnd('left')}
            >
              ←
            </button>
            <button
              className="w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm active:bg-white/40 flex items-center justify-center"
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={() => handleTouchEnd('right')}
              onMouseDown={() => handleTouchStart('right')}
              onMouseUp={() => handleTouchEnd('right')}
            >
              →
            </button>
          </div>
          
          <button
            className="w-20 h-20 bg-blue-500/30 rounded-full backdrop-blur-sm active:bg-blue-500/50 flex items-center justify-center border-2 border-blue-400/30"
            onTouchStart={() => handleTouchStart('jump')}
            onTouchEnd={() => handleTouchEnd('jump')}
            onMouseDown={() => handleTouchStart('jump')}
            onMouseUp={() => handleTouchEnd('jump')}
          >
            JUMP
          </button>
        </div>
      )}
    </div>
  );
}
