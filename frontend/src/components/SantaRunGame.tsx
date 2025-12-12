import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Gift, Snowflake } from 'lucide-react';

export default function SantaRunGame({ onClose }: { onClose: () => void }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [lane, setLane] = useState(1); // 0: Left, 1: Center, 2: Right
    const [obstacles, setObstacles] = useState<{ id: number; lane: number; z: number; type: 'tree' | 'gift' }[]>([]);
    const requestRef = useRef<number>();
    const speedRef = useRef(0.2); // Initial speed
    const scoreRef = useRef(0);

    // Game Loop
    const gameLoop = () => {
        setObstacles(prev => {
            const newObstacles = prev
                .map(obs => ({ ...obs, z: obs.z - speedRef.current }))
                .filter(obs => obs.z > -2); // Remove if behind camera

            // Collision Detection
            const playerZ = 0; // Player is at z=0
            const collisionThreshold = 0.5; // Distance to check collision

            for (const obs of newObstacles) {
                if (Math.abs(obs.z - playerZ) < collisionThreshold && obs.lane === lane) {
                    if (obs.type === 'tree') {
                        setGameOver(true);
                        setIsPlaying(false);
                    } else if (obs.type === 'gift') {
                        // Collect gift
                        scoreRef.current += 10;
                        setScore(scoreRef.current);
                        obs.z = -10; // Hide it (hacky but works for now)
                    }
                }
            }

            // Spawn new obstacles
            if (Math.random() < 0.05) { // 5% chance per frame
                newObstacles.push({
                    id: Date.now() + Math.random(),
                    lane: Math.floor(Math.random() * 3), // 0, 1, 2
                    z: 50, // Start far away
                    type: Math.random() > 0.3 ? 'tree' : 'gift'
                });
            }

            return newObstacles;
        });

        if (!gameOver && isPlaying) {
            speedRef.current += 0.0001; // Increase speed slowly
            requestRef.current = requestAnimationFrame(gameLoop);
        }
    };

    useEffect(() => {
        if (isPlaying && !gameOver) {
            requestRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, gameOver, lane]); // Depend on lane for collision check closure

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isPlaying) return;
        if (e.key === 'ArrowLeft') setLane(l => Math.max(0, l - 1));
        if (e.key === 'ArrowRight') setLane(l => Math.min(2, l + 1));
    };

    // Touch controls
    const touchStartX = useRef(0);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX.current;
        if (Math.abs(diff) > 50) { // Swipe threshold
            if (diff > 0) setLane(l => Math.min(2, l + 1)); // Right
            else setLane(l => Math.max(0, l - 1)); // Left
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying]);

    const startGame = () => {
        setObstacles([]);
        setScore(0);
        scoreRef.current = 0;
        speedRef.current = 0.2;
        setGameOver(false);
        setIsPlaying(true);
        setLane(1);
    };

    const saveScore = async () => {
        if (score > 0) {
            await supabase.rpc('award_points', { p_user_id: (await supabase.auth.getUser()).data.user?.id, p_points: Math.min(score, 50), p_reason: 'Santa Run' });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

            {/* UI Layer */}
            <div className="absolute top-4 left-4 z-50 text-white font-black text-2xl drop-shadow-md">
                SCORE: {score}
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-red-600 text-white px-2 py-1 rounded font-bold border-2 border-white">
                EXIT
            </button>

            {/* Game Over Screen */}
            {gameOver && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white">
                    <h2 className="text-4xl font-black text-red-500 mb-4">CRASHED!</h2>
                    <p className="text-xl mb-4">Final Score: {score}</p>
                    <div className="flex gap-4">
                        <button onClick={startGame} className="bg-green-600 px-6 py-3 rounded-xl font-bold border-4 border-white active:scale-95 transition-transform">
                            TRY AGAIN
                        </button>
                        <button onClick={saveScore} className="bg-gray-600 px-6 py-3 rounded-xl font-bold border-4 border-gray-400 active:scale-95 transition-transform">
                            SAVE & QUIT
                        </button>
                    </div>
                </div>
            )}

            {/* Start Screen */}
            {!isPlaying && !gameOver && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center text-white p-4 text-center">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-green-500 skew-y-[-5deg] mb-8">
                        SANTA RUN 3D
                    </h1>
                    <p className="mb-8 max-w-md">Swipe or use Arrow Keys to dodge trees and collect gifts!</p>
                    <button onClick={startGame} className="bg-red-600 px-8 py-4 rounded-full font-black text-2xl border-4 border-white animate-pulse shadow-[0px_0px_20px_rgba(255,0,0,0.5)]">
                        START RUNNING
                    </button>
                </div>
            )}

            {/* 3D World */}
            <div style={{
                perspective: '800px',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                background: 'linear-gradient(to bottom, #0F172A 0%, #1E293B 50%, #E2E8F0 50%, #CBD5E1 100%)' // Sky and Ground
            }}>
                <div style={{
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    width: '100%',
                    height: '100%',
                    transform: 'rotateX(20deg) translateY(-50px)' // Camera Angle
                }}>
                    {/* Lanes Guidelines */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[2000px] bg-white/10"
                        style={{ transform: 'translateX(-33%) rotateX(90deg) translateZ(-500px)' }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[2000px] bg-white/10"
                        style={{ transform: 'translateX(33%) rotateX(90deg) translateZ(-500px)' }}></div>

                    {/* Player */}
                    <div style={{
                        position: 'absolute',
                        bottom: '10%',
                        left: '50%',
                        width: '60px',
                        height: '100px',
                        backgroundColor: 'red',
                        backgroundImage: 'url("https://api.iconify.design/noto:santa-claus.svg")',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: `translateX(-50%) translateX(${(lane - 1) * 150}px) translateZ(0px)`, // 150px lane width
                        boxShadow: '0 20px 20px rgba(0,0,0,0.5)'
                    }}>
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-black px-2 rounded font-bold text-xs">
                            YOU
                        </div>
                    </div>

                    {/* Obstacles & Gifts */}
                    {obstacles.map(obs => (
                        <div key={obs.id} style={{
                            position: 'absolute',
                            bottom: '10%',
                            left: '50%',
                            width: obs.type === 'tree' ? '80px' : '50px',
                            height: obs.type === 'tree' ? '120px' : '50px',
                            transform: `translateX(-50%) translateX(${(obs.lane - 1) * 150}px) translateZ(-${obs.z * 50}px) scale(${Math.max(0, 1 - obs.z / 100)})`,
                            opacity: obs.z > 80 ? 0 : 1, // Fade in distance
                            zIndex: Math.floor(1000 - obs.z),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {obs.type === 'tree' ? (
                                <span className="text-[100px] filter drop-shadow-xl">🎄</span>
                            ) : (
                                <div className="text-[60px] animate-bounce filter drop-shadow-[0_0_10px_gold]">🎁</div>
                            )}
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
}
