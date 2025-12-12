import React from 'react';
export default function ChristmasBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#C41E3A]">
            { }
            {/* Solid clean background */}
            <div className="absolute inset-0 bg-[#C41E3A]"></div>

            {/* Subtle Snow Pattern (Optional, very low opacity) */}
            <div className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            ></div>
            { }
            <div className="absolute top-0 left-0 w-full flex justify-around pointer-events-none z-10 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={`light-${i}`}
                        className={`w-3 h-3 rounded-full mt-[-5px] shadow-lg animate-blink ${i % 3 === 0 ? 'bg-yellow-300' : i % 3 === 1 ? 'bg-green-400' : 'bg-cyan-300'}`}
                        style={{
                            animationDelay: `${i * 0.1}s`,
                        }}
                    ></div>
                ))}
                <div className="absolute top-[-2px] left-0 w-full h-[2px] bg-black"></div>
            </div>
            { }
            <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={`snow-${i}`}
                        className="absolute text-white select-none animate-fall font-bold"
                        style={{
                            top: '-10%',
                            left: `${Math.random() * 100}%`,
                            fontSize: `${Math.random() * 20 + 10}px`, // Fixed 'px' space
                            animationDuration: `${Math.random() * 5 + 5}s`, // Fixed 's' space
                            animationDelay: `${Math.random() * 5}s`, // Fixed 's' space
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                            textShadow: '2px 2px 0px black'
                        }}
                    >
                        ❄
                    </div>
                ))}
            </div>
            <style>{`
        @keyframes fall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(20px) rotate(360deg); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fall { animation-name: fall; }
        .animate-blink { animation: blink 2s infinite; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        .animate-spin-slow-bg { animation: spin 60s linear infinite; }
      `}</style>
        </div>
    );
}
