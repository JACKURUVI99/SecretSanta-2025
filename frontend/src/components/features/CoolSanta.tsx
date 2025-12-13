export default function CoolSanta() {
  return (
    <div className="w-40 h-40 relative filter drop-shadow-[5px_5px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300">
      <style>{`
        @keyframes slideGlasses {
          0%, 20% { transform: translateY(0); } /* On eyes */
          40%, 60% { transform: translateY(15px); } /* Slid down */
          80%, 100% { transform: translateY(0); } /* Back up */
        }
        @keyframes blink {
          0%, 48% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
          52%, 100% { transform: scaleY(1); }
        }
        .animate-glasses {
          animation: slideGlasses 4s infinite ease-in-out;
        }
        .animate-blink {
          animation: blink 4s infinite linear;
          transform-origin: center;
        }
      `}</style>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {}
        <circle cx="50" cy="50" r="40" fill="#FCD5B5" stroke="black" strokeWidth="3" />
        {}
        <path d="M 10 50 Q 50 110 90 50 L 90 50 Q 95 50 90 40 L 10 40 Q 5 50 10 50" fill="white" stroke="black" strokeWidth="3" />
        {}
        <path d="M 40 70 Q 50 75 60 70" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" />
        {}
        <path d="M 50 65 Q 65 65 75 55 Q 65 50 50 55 Q 35 50 25 55 Q 35 65 50 65" fill="#F0F0F0" stroke="black" strokeWidth="2" />
        {}
        <g className="animate-blink">
          <circle cx="35" cy="45" r="4" fill="black" />
          <circle cx="65" cy="45" r="4" fill="black" />
        </g>
        {}
        <path d="M 10 40 Q 50 -10 90 40" fill="#C41E3A" stroke="black" strokeWidth="3" />
        <circle cx="90" cy="40" r="8" fill="white" stroke="black" strokeWidth="3" />
        {}
        <g className="animate-glasses">
          {}
          <path d="M 20 40 Q 35 40 45 45 Q 35 60 20 55 Q 15 45 20 40" fill="black" stroke="black" strokeWidth="2" />
          <path d="M 80 40 Q 65 40 55 45 Q 65 60 80 55 Q 85 45 80 40" fill="black" stroke="black" strokeWidth="2" />
          {}
          <path d="M 45 45 Q 50 42 55 45" fill="none" stroke="black" strokeWidth="2" />
          {}
          <path d="M 25 45 Q 30 43 35 45" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
          <path d="M 65 45 Q 70 43 75 45" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
        </g>
        {}
        <circle cx="50" cy="55" r="5" fill="#F45656" stroke="black" strokeWidth="2" />
      </svg>
    </div>
  );
}
