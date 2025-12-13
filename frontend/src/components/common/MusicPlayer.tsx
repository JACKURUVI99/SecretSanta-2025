import { useState, useEffect, useRef } from 'react';
export default function MusicPlayer() {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasInteractedRef = useRef(false);
    useEffect(() => {
        // 🎵 Jingle Bells (Kevin MacLeod) - Royalty Free
        const audioUrl = 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kevin_MacLeod/Jazz_Sampler/Kevin_MacLeod_-_Jingle_Bells_90bpm.mp3';
        audioRef.current = new Audio(audioUrl);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        const attemptPlay = async () => {
            if (!audioRef.current) return;
            try {
                await audioRef.current.play();
                setPlaying(true);
                cleanupListeners();
            } catch (e) {
                console.log("Autoplay waiting for interaction...");
                setPlaying(false);
            }
        };
        const handleInteraction = () => {
            if (hasInteractedRef.current) return;
            hasInteractedRef.current = true;
            attemptPlay();
        };
        const cleanupListeners = () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
        // Add listeners for any user interaction
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        // Try playing immediately in case allowed
        attemptPlay();
        return () => {
            cleanupListeners();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);
    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) {
            audioRef.current.pause();
            setPlaying(false);
        } else {
            audioRef.current.play().then(() => setPlaying(true)).catch(e => console.error(e));
        }
    };
    return (
        <button
            onClick={togglePlay}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 bg-white border-2 border-black px-3 py-2 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-[1px] hover:shadow-none ${!playing ? 'animate-pulse' : ''}`}
            title={playing ? "Mute Music" : "Play Music"}
        >
            <span className="text-xl">{playing ? '🔊' : '🔇'}</span>
            <span className="text-xs font-bold uppercase hidden sm:inline">
                {playing ? 'Music on' : 'Music off'}
            </span>
        </button>
    );
}
