import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import axios from 'axios';

const ChessGame = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('');
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize game state
  useEffect(() => {
    setFen(game.fen());
  }, [game]);

  // Update game status when game changes
  useEffect(() => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        setGameStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
      } else if (game.isDraw()) {
        setGameStatus('Draw!');
      } else {
        setGameStatus('Game over!');
      }
    } else if (game.isCheck()) {
      setGameStatus(`${game.turn() === 'w' ? 'White' : 'Black'} is in check!`);
    } else {
      setGameStatus(`${isPlayerTurn ? 'Your' : 'AI\'s'} turn`);
    }
  }, [game, isPlayerTurn]);

  // Fallback random move function - MOVED BEFORE makeAiMove
  const makeRandomMove = useCallback(() => {
    const newGame = new Chess(game.fen());
    const possibleMoves = newGame.moves();
    
    if (possibleMoves.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    newGame.move(possibleMoves[randomIndex]);
    
    setGame(newGame);
    setFen(newGame.fen());
    setIsPlayerTurn(true);
  }, [game]);

  // Make AI move - NOW AFTER makeRandomMove
  const makeAiMove = useCallback(async () => {
    if (game.isGameOver() || isPlayerTurn) return;
    
    setLoading(true);
    try {
      // Using Lichess API for AI moves
      const response = await axios.get(`https://lichess.org/api/cloud-eval`, {
        params: {
          fen: game.fen(),
          multiPv: 1
        }
      });
      
      // Extract the best move from the response
      const bestMove = response.data.pvs[0].moves.split(' ')[0];
      
      // Make the move
      const newGame = new Chess(game.fen());
      newGame.move(bestMove);
      
      setGame(newGame);
      setFen(newGame.fen());
      setIsPlayerTurn(true);
    } catch (error) {
      console.error('Error making AI move:', error);
      // Fallback to making a random move if API fails
      makeRandomMove();
    }
    setLoading(false);
  }, [game, isPlayerTurn, makeRandomMove]);

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (!isPlayerTurn && !game.isGameOver()) {
      const timer = setTimeout(() => {
        makeAiMove();
      }, 500); // Small delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, game, makeAiMove]);

  // Handle player move
  const onDrop = (sourceSquare, targetSquare) => {
    if (!isPlayerTurn || game.isGameOver()) return false;
    
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      if (move === null) return false;
      
      setFen(game.fen());
      setIsPlayerTurn(false);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Reset game
  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setIsPlayerTurn(true);
    setGameStatus('Your turn');
  };

  return (
    <div className="chess-game">
      <div className="board-container" style={{ width: '760px', margin: '0 auto' }}>
        <Chessboard position={fen} onPieceDrop={onDrop} />
      </div>
      <div className="game-info">
        <div className="status">{gameStatus}</div>
        {loading && <div>AI is thinking...</div>}
        <button onClick={resetGame}>Reset Game</button>
      </div>
    </div>
  );
};

export default ChessGame;