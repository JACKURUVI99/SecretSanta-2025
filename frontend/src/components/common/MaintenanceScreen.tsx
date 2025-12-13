import React from 'react';
import ChristmasBackground from './ChristmasBackground';
export default function MaintenanceScreen() {
    return (
        <div className="min-h-screen bg-[#E0E7FF] flex flex-col items-center justify-center relative overflow-hidden font-mono p-4 text-center">
            <ChristmasBackground />
            <div className="relative z-10 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_black] max-w-lg transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="absolute -top-6 -left-6 text-6xl animate-bounce">
                    🎅
                </div>
                <div className="absolute -bottom-6 -right-6 text-6xl animate-bounce delay-700">
                    🦌
                </div>
                <h1 className="text-4xl font-black uppercase mb-4 tracking-tighter">
                    Santa is <br />
                    <span className="text-[#C41E3A] bg-black px-2 text-white transform -rotate-2 inline-block mt-2">Napping</span>
                </h1>
                <div className="bg-[#E0E7FF] border-2 border-black p-4 mb-6 relative">
                    <div className="text-4xl mb-2 animate-pulse">💤</div>
                    <p className="font-bold text-lg">The workshop is getting a quick polish!</p>
                    <p className="font-bold text-sm mt-2 text-gray-600">Please check back in a few minutes.</p>
                </div>
                <div className="flex justify-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping delay-100"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping delay-200"></div>
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-400">
                    APP IS IN MAINTENANCE!
                </p>
            </div>
            <style>{`
        @keyframes drift {
          0% { background-position: 0 0; }
          100% { background-position: 100% 100%; }
        }
      `}</style>
        </div>
    );
}
