import santaimg from '../../assets/santa_flat.png';
import ChristmasBackground from '../common/ChristmasBackground';

export default function AuthPage() {
  const handleUserLogin = () => {
    const clientId = import.meta.env.VITE_DAUTH_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = `https://auth.delta.nitt.edu/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email+openid+profile+user`;
  };

  return (
    <div className="min-h-screen bg-[#E0E7FF] flex flex-col items-center justify-center relative overflow-hidden font-mono p-4 text-center">
      <ChristmasBackground />

      <div className="relative z-10 w-full max-w-md mx-auto animate-bounce-in">
        <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0px_0px_black] relative text-center">

          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-40 z-20">
            <img
              src={santaimg}
              alt="Santa"
              className="drop-shadow-lg"
            />
          </div>

          <div className="mt-20 mb-6 space-y-2">
            <h1 className="text-4xl font-black uppercase tracking-wide text-black mb-2">
              Secret Santa <span className="text-[#C41E3A]">2025</span>
            </h1>
            <div className="inline-block bg-[#00A86B] text-white border-2 border-black px-4 py-1.5 text-sm font-black uppercase shadow-[4px_4px_0px_0px_black]">
              NIT Trichy Edition 🎄
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border-2 border-black p-4 text-left">
              <p className="font-bold text-sm mb-2 uppercase tracking-wide text-blue-800">🚀 How it works:</p>
              <ul className="text-sm font-bold text-gray-700 space-y-2 ml-4 list-disc">
                <li>Log in with your <span className="text-[#C41E3A]">DAuth</span> credentials</li>
                <li>Wait for the Grinch's approval</li>
                <li>Find your match & spread joy!</li>
              </ul>
            </div>

            <button
              onClick={handleUserLogin}
              className="w-full bg-[#C41E3A] text-white text-xl font-black uppercase py-4 border-4 border-black shadow-[6px_6px_0px_0px_black] hover:shadow-[8px_8px_0px_0px_black] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-3"
            >
              <span>Login with DAuth</span>
              <span className="text-2xl">🎅</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Presented by
            </p>
            <a
              href="https://www.instagram.com/fr.eeea.ky_fam/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-widest text-black hover:text-[#00A86B] hover:underline"
            >
              @fr.eeea.ky_fam
            </a>
          </div>

        </div>
      </div>

      <div className="fixed bottom-4 text-[10px] font-bold text-gray-400 opacity-50">
        v2.0.26 (Deployed: {new Date().toLocaleString()}) - NIT EDITION
      </div>
    </div>
  );
}
