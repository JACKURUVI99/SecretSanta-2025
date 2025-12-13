import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { Trophy } from 'lucide-react';

export default function FlappySanta({ onGameComplete }: { onGameComplete: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [playing, setPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Game Constants
    const GRAVITY = 0.6;
    const JUMP = -8; // slightly stronger jump
    const PIPE_SPEED = 3;
    const PIPE_SPACING = 200; // increased spacing
    const GAP_SIZE = 170; // easier gap

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let birdY = canvas.height / 2;
        let birdVelocity = 0;
        let pipes: { x: number; topHeight: number }[] = [];
        let frameId: number;
        let currentScore = 0;

        const birdImg = new Image();
        birdImg.src = "https://img.icons8.com/color/48/santa.png"; // Placeholder Santa

        const resetGame = () => {
            birdY = canvas.height / 2;
            birdVelocity = 0;
            pipes = [];
            currentScore = 0;
            setScore(0);
        };

        const draw = () => {
            if (!playing) return;

            // Draw Background
            ctx.fillStyle = '#87CEEB'; // Sky blue
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Bird Physics
            birdVelocity += GRAVITY;
            birdY += birdVelocity;

            // Draw Bird
            ctx.drawImage(birdImg, 50, birdY, 40, 40);

            // Pipe Logic
            if (frames % 90 === 0) { // Slower pipe generation
                pipes.push({
                    x: canvas.width,
                    topHeight: Math.random() * (canvas.height - GAP_SIZE - 100) + 50
                });
            }

            pipes.forEach((pipe, index) => {
                pipe.x -= PIPE_SPEED;

                // Draw Pipes (Green Chimneys)
                ctx.fillStyle = '#2ECC71';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;

                // Top Pipe
                ctx.fillRect(pipe.x, 0, 50, pipe.topHeight);
                ctx.strokeRect(pipe.x, 0, 50, pipe.topHeight);

                // Bottom Pipe
                ctx.fillRect(pipe.x, pipe.topHeight + GAP_SIZE, 50, canvas.height - (pipe.topHeight + GAP_SIZE));
                ctx.strokeRect(pipe.x, pipe.topHeight + GAP_SIZE, 50, canvas.height - (pipe.topHeight + GAP_SIZE));

                // Collision Check
                if (
                    (50 + 30 > pipe.x && 50 + 10 < pipe.x + 50) && // X collision (narrower hitbox)
                    (birdY + 10 < pipe.topHeight || birdY + 30 > pipe.topHeight + GAP_SIZE) // Y collision
                ) {
                    endGame();
                }

                // Score Check
                if (pipe.x + 50 < 50 && !pipe['passed']) {
                    currentScore++;
                    setScore(currentScore);
                    pipe['passed'] = true;
                    // Remove fixed win condition
                    // if (currentScore === 5) { endGame(true); }
                }
            });

            // Remove off-screen pipes
            pipes = pipes.filter(p => p.x > -60);

            // Ground Collision
            if (birdY > canvas.height || birdY < 0) {
                endGame(currentScore);
            }

            frames++;
            frameId = requestAnimationFrame(draw);
        };

        const endGame = (finalScore = 0) => {
            setPlaying(false);
            cancelAnimationFrame(frameId);
            if (finalScore > highScore) setHighScore(finalScore);

            if (finalScore > 0) {
                // Submit actual score
                // alert(`Game Over! You scored ${finalScore} points! 🎅`);
                api.submitGameScore('flappy_santa', finalScore).catch(console.error);
                // Optional: Don't close modal immediately to let them replay?
                // The prompt implies "how many points they are taking tht much points should come". 
                // So we submit and maybe notify.
            }
        };

        let frames = 0;
        if (playing) {
            resetGame();
            draw();
        }

        const handleClick = () => {
            if (playing) {
                birdVelocity = JUMP;
            }
        };

        canvas.addEventListener('click', handleClick);
        // Add touch listener for mobile
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // prevent scroll
            handleClick();
        }, { passive: false });

        return () => {
            cancelAnimationFrame(frameId);
            canvas.removeEventListener('click', handleClick);
        };
    }, [playing]);

    return (
        <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_black] text-center">
            <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
                <h3 className="font-black text-xl uppercase flex items-center gap-2">
                    🎅 Flappy Santa
                </h3>
                <div className="bg-yellow-300 px-3 py-1 font-bold border-2 border-black">
                    Score: {score} | Best: {highScore}
                </div>
            </div>

            <div className="relative inline-block border-4 border-black bg-[#87CEEB]">
                <canvas
                    ref={canvasRef}
                    width={320}
                    height={480}
                    className="cursor-pointer"
                />
                {!playing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <button
                            onClick={() => setPlaying(true)}
                            className="bg-[#C41E3A] text-white px-8 py-4 text-2xl font-black uppercase border-4 border-white shadow-[4px_4px_0px_black] hover:-translate-y-1 transition-transform animate-bounce"
                        >
                            START GAME
                        </button>
                    </div>
                )}
            </div>
            <p className="mt-4 font-bold text-gray-600">Tap to Fly! Get 5 points to win.</p>
        </div>
    );
}
