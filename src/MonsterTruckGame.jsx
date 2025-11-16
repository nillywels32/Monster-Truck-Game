import React, { useState, useEffect, useRef } from 'react';

const MonsterTruckGame = () => {
  const [isHolding, setIsHolding] = useState(false);
  const [power, setPower] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [truckX, setTruckX] = useState(50);
  const [truckY, setTruckY] = useState(400);
  const [velocityX, setVelocityX] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [gameState, setGameState] = useState('ready'); // ready, jumping, success, tryAgain
  const [attempts, setAttempts] = useState(0);
  const [level, setLevel] = useState(1);

  const animationRef = useRef(null);
  const resetTimerRef = useRef(null);
  const GROUND_Y = 400;
  const RAMP_X = 300;
  const RAMP_Y = 350;
  const GRAVITY = 0.5;
  const MAX_POWER = 100;

  // Level-based goal positioning
  const GOAL_X = 500 + (level * 50); // Goal gets farther each level
  const GOAL_Y = 300;

  // Handle spacebar press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && gameState === 'ready' && !isHolding) {
        e.preventDefault();
        setIsHolding(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' && isHolding) {
        e.preventDefault();
        launch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isHolding, gameState]);

  // Build up power while holding
  useEffect(() => {
    let interval;
    if (isHolding && power < MAX_POWER) {
      interval = setInterval(() => {
        setPower(prev => Math.min(prev + 2, MAX_POWER));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isHolding, power]);

  // Launch the truck
  const launch = () => {
    setIsHolding(false);
    setIsJumping(true);
    setGameState('jumping');
    setAttempts(prev => prev + 1);

    // Convert power to velocity (speed and angle)
    const speed = (power / MAX_POWER) * 15 + 5;
    const angle = 45; // Fixed 45-degree angle for simplicity
    const radians = (angle * Math.PI) / 180;

    setVelocityX(speed * Math.cos(radians));
    setVelocityY(-speed * Math.sin(radians));
  };

  // Physics animation loop
  useEffect(() => {
    if (isJumping) {
      const animate = () => {
        setTruckX(prev => prev + velocityX);
        setTruckY(prev => prev + velocityY);
        setVelocityY(prev => prev + GRAVITY);

        // Check if landed
        if (truckY >= GROUND_Y) {
          setIsJumping(false);
          setTruckY(GROUND_Y);
          setVelocityX(0);
          setVelocityY(0);

          // Check if reached goal
          const distance = Math.abs(truckX - GOAL_X);
          if (distance < 80) {
            setGameState('success');
            // Auto-advance to next level after 2 seconds
            resetTimerRef.current = setTimeout(() => {
              nextLevel();
            }, 2000);
          } else {
            setGameState('tryAgain');
            // Auto-retry after 1.5 seconds
            resetTimerRef.current = setTimeout(() => {
              reset();
            }, 1500);
          }
          return;
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isJumping, truckX, truckY, velocityX, velocityY, GOAL_X]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  // Reset game (same level)
  const reset = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    setPower(0);
    setTruckX(50);
    setTruckY(GROUND_Y);
    setVelocityX(0);
    setVelocityY(0);
    setIsJumping(false);
    setIsHolding(false);
    setGameState('ready');
  };

  // Advance to next level
  const nextLevel = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    setLevel(prev => prev + 1);
    setPower(0);
    setTruckX(50);
    setTruckY(GROUND_Y);
    setVelocityX(0);
    setVelocityY(0);
    setIsJumping(false);
    setIsHolding(false);
    setGameState('ready');
    setAttempts(0); // Reset attempts for new level
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 100%)',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      position: 'relative'
    }}>
      {/* Title */}
      <h1 style={{
        textAlign: 'center',
        color: '#FF6B6B',
        fontSize: '48px',
        margin: '20px',
        textShadow: '3px 3px 6px rgba(0,0,0,0.2)',
        fontWeight: 'bold'
      }}>
        🏁 Monster Truck Jump! 🏁
      </h1>

      {/* Instructions */}
      <div style={{
        textAlign: 'center',
        fontSize: '28px',
        color: '#333',
        fontWeight: 'bold',
        marginBottom: '10px'
      }}>
        {gameState === 'ready' && '🎮 Hold SPACEBAR to build power, then RELEASE to jump!'}
        {gameState === 'jumping' && '🚀 GO GO GO!'}
        {gameState === 'success' && '🎉 AMAZING! Moving to next level...'}
        {gameState === 'tryAgain' && '💪 Try again! Hold longer or shorter!'}
      </div>

      {/* Level and Attempt counter */}
      <div style={{
        position: 'absolute',
        top: '100px',
        right: '30px',
        fontSize: '24px',
        background: 'white',
        padding: '15px 25px',
        borderRadius: '15px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        fontWeight: 'bold'
      }}>
        Level: {level} | Attempts: {attempts}
      </div>

      {/* Power meter */}
      {gameState === 'ready' && (
        <div style={{
          position: 'absolute',
          top: '150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '400px'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '10px',
            textAlign: 'center',
            color: '#333'
          }}>
            Power: {Math.round(power)}%
          </div>
          <div style={{
            width: '100%',
            height: '40px',
            background: '#DDD',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '4px solid #333',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: `${power}%`,
              height: '100%',
              background: `linear-gradient(to right, #4CAF50, #FFC107, #FF5722)`,
              transition: 'width 0.1s',
              borderRadius: '16px'
            }} />
          </div>
        </div>
      )}

      {/* Game canvas */}
      <svg width="800" height="500" style={{
        display: 'block',
        margin: '50px auto',
        background: 'transparent'
      }}>
        {/* Ground */}
        <rect x="0" y={GROUND_Y + 50} width="800" height="50" fill="#8B4513" />
        <rect x="0" y={GROUND_Y} width="800" height="50" fill="#228B22" />

        {/* Ramp */}
        <polygon
          points={`${RAMP_X},${GROUND_Y} ${RAMP_X + 100},${GROUND_Y} ${RAMP_X + 100},${RAMP_Y}`}
          fill="#666"
          stroke="#333"
          strokeWidth="3"
        />
        <line
          x1={RAMP_X + 10} y1={GROUND_Y - 10}
          x2={RAMP_X + 90} y2={RAMP_Y + 10}
          stroke="#FFD700"
          strokeWidth="3"
          strokeDasharray="5,5"
        />

        {/* Goal area - Red Bullseye Target */}
        <g>
          {/* Outer red circle */}
          <circle cx={GOAL_X} cy={GOAL_Y} r="45" fill="#FF0000" />
          {/* White ring */}
          <circle cx={GOAL_X} cy={GOAL_Y} r="30" fill="#FFFFFF" />
          {/* Inner red circle */}
          <circle cx={GOAL_X} cy={GOAL_Y} r="15" fill="#FF0000" />
          {/* Center red dot */}
          <circle cx={GOAL_X} cy={GOAL_Y} r="6" fill="#CC0000" />

          {/* Label below target */}
          <text
            x={GOAL_X}
            y={GOAL_Y + 70}
            textAnchor="middle"
            fontSize="24"
            fontWeight="bold"
            fill="#FF0000"
          >
            TARGET
          </text>
        </g>

        {/* Monster Truck */}
        <g transform={`translate(${truckX}, ${truckY})`}>
          {/* Truck body */}
          <rect x="-30" y="-25" width="60" height="30" fill="#FF0000" stroke="#8B0000" strokeWidth="3" rx="5" />
          <rect x="-25" y="-35" width="35" height="15" fill="#FF4444" stroke="#8B0000" strokeWidth="2" rx="3" />

          {/* Windows */}
          <rect x="-20" y="-32" width="12" height="10" fill="#87CEEB" stroke="#333" strokeWidth="1" />
          <rect x="-5" y="-32" width="12" height="10" fill="#87CEEB" stroke="#333" strokeWidth="1" />

          {/* Wheels */}
          <circle cx="-20" cy="5" r="15" fill="#333" stroke="#000" strokeWidth="3" />
          <circle cx="-20" cy="5" r="8" fill="#666" />
          <circle cx="20" cy="5" r="15" fill="#333" stroke="#000" strokeWidth="3" />
          <circle cx="20" cy="5" r="8" fill="#666" />

          {/* Flame decals */}
          <path d="M -30,-20 Q -10,-25 0,-20" fill="#FFA500" opacity="0.7" />
          <path d="M -25,-15 Q -8,-18 5,-15" fill="#FF4500" opacity="0.7" />
        </g>
      </svg>


      {/* Learning info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(255,255,255,0.9)',
        padding: '15px',
        borderRadius: '10px',
        fontSize: '18px',
        maxWidth: '300px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
      }}>
        <strong>🎓 Learn:</strong><br/>
        • More power = faster speed<br/>
        • Faster speed = longer jump<br/>
        • Find the right power!
      </div>
    </div>
  );
};

export default MonsterTruckGame;
