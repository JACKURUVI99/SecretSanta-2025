import React from 'react';
export default function SerialLights() {
    return (
        <div className="fixed top-0 left-0 w-full z-40 pointer-events-none overflow-hidden flex justify-between px-2" style={{ height: '30px' }}>
            { }
            <svg className="absolute top-[-15px] left-0 w-full h-full" preserveAspectRatio="none">
                <path d="M0,20 Q50,40 100,20 T200,20 T300,20 T400,20 T500,20 T600,20 T700,20 T800,20 T900,20 T1000,20 T1100,20 T1200,20 T1300,20 T1400,20 T1500,20"
                    fill="none" stroke="#222" strokeWidth="2" style={{ transform: 'scaleX(2)' }} />
            </svg>
            {/* Lights */}
            {[...Array(30)].map((_, i) => {
                const colors = ['#ff0000', '#00ff00', '#ffff00', '#00ffff', '#ff00ff'];
                const color = colors[i % colors.length];
                return (
                    <div
                        key={i}
                        className="w-3 h-3 rounded-full relative animate-glow"
                        style={{
                            backgroundColor: color,
                            boxShadow: `0 0 10px 2px ${color}`,
                            top: '5px',
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: '1.5s'
                        }}
                    >
                        { }
                        <div className="absolute top-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-600 rounded-t-sm"></div>
                    </div>
                );
            })}
            <style>{`
        @keyframes glow {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 10px 2px currentColor; }
          50% { opacity: 0.4; transform: scale(0.8); box-shadow: 0 0 2px 0px currentColor; }
        }
        .animate-glow {
          animation: glow 2s infinite ease-in-out;
        }
      `}</style>
        </div>
    );
}
