import santaimg from '../assets/santa_flat.png';
import ChristmasBackground from './ChristmasBackground';

export default function AuthPage() {
  const handleUserLogin = () => {
    const clientId = import.meta.env.VITE_DAUTH_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_DAUTH_REDIRECT_URI;
    window.location.href = `https://auth.delta.nitt.edu/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&grant_type=authorization_code&scope=email+openid+profile+user`;
  };

  return (
    <div className="min-h-screen bg-[#E0E7FF] flex items-center justify-center p-4 font-mono">
      <ChristmasBackground />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md px-4">
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-20 w-32 sm:w-40 group">
          <div className="relative">
            <img
              src={santaimg}
              alt="Flat Santa"
              className="drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300 relative z-10"
            />
            <div className="absolute top-[38%] left-[28%] w-[12%] h-[8%] bg-[#FCD5B5] animate-blink-lid"></div>
            <div className="absolute top-[38%] right-[28%] w-[12%] h-[8%] bg-[#FCD5B5] animate-blink-lid"></div>
            <style>{`.animate-blink-lid { animation: blinkLid 4s steps(2) infinite; } @keyframes blinkLid { 0%, 45% { height: 0; } 50% { height: 12%; } 55%, 100% { height: 0; } }`}</style>
          </div>
        </div>
        <div className="frost-glass snow-cap p-6 sm:p-8 mt-16 relative overflow-visible animate-float">
          <div className="text-center mb-6 sm:mb-8 pt-4">
            <h1 className="text-4xl sm:text-6xl font-black text-[#C41E3A] tracking-wider animate-title-pulse cursor-default hover:text-[#00A86B] transition-colors">
              Secret Santa
            </h1>
            <p className="text-lg font-bold text-[#00A86B] bg-white/90 inline-block px-4 py-1 rounded-full border-2 border-[#00A86B] transform -rotate-2 mt-2 shadow-sm animate-jingle cursor-default">
              ❄️ EEE'28 Edition ❄️
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={handleUserLogin}
              className="w-full bg-[#C41E3A] text-white border-4 border-black font-black uppercase py-4 text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 group"
            >
              <span className="group-hover:scale-110 transition-transform">🎅</span>
              <span>Login with DAuth</span>
            </button>
          </div>

          <div className="mt-8 text-center pt-6 border-t-2 border-dashed border-black/20">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Made with 🎄 for EEE'28
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
