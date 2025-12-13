import React from 'react';
import { X, ArrowDown } from 'lucide-react';

interface VisualTutorialProps {
    onClose: () => void;
}

const TutorialStep = ({ icon, title, desc, delay }: { icon: string; title: string; desc: string, delay: string }) => (
    <div className={`flex flex-col items-center text-center animate-slide-up-bounce`} style={{ animationDelay: delay }}>
        <div className="text-6xl mb-2 drop-shadow-md transform hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <div className="bg-white border-sketch p-4 shadow-hard font-outfit text-xl rotate-1 max-w-[250px]">
            <h3 className="font-bold text-red-600 mb-1 leading-none text-2xl">{title}</h3>
            <p className="text-gray-800 leading-tight">{desc}</p>
        </div>
    </div>
);

const Arrow = () => (
    <div className="text-black my-2 animate-bounce">
        <ArrowDown size={32} strokeWidth={3} />
    </div>
);

export default function VisualTutorial({ onClose }: VisualTutorialProps) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            {/* Modal Container - Abeto Style */}
            <div className="relative bg-[#E0F7FA] w-full max-w-lg max-h-[90vh] overflow-y-auto border-[4px] border-black shadow-[8px_8px_0px_0px_black] rounded-xl p-6 font-outfit">

                {/* Header */}
                <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#E0F7FA] z-10 py-2 border-b-4 border-black border-dashed">
                    <h2 className="text-2xl md:text-3xl font-black font-mountains text-black transform -rotate-2">
                        How to Play 🎅
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-red-500 text-white border-2 border-black hover:scale-110 active:scale-95 transition-transform rounded-full shadow-[2px_2px_0px_black]"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Flowchart Content */}
                <div className="flex flex-col items-center gap-2 pb-24">

                    <TutorialStep
                        icon="🎅"
                        title="You're Santa!"
                        desc="You'll be assigned a 'Child' (Giftee) from your batch. Your mission: Buy them a secret gift!"
                        delay="0s"
                    />

                    <Arrow />

                    <TutorialStep
                        icon="🎁"
                        title="The Mission"
                        desc="Keep it a secret! Use the anonymous chat to tease them or find out what they like."
                        delay="0.5s"
                    />

                    <Arrow />

                    <TutorialStep
                        icon="🎉"
                        title="Reveal Day"
                        desc="On the big day, we'll gather to reveal identities and exchange gifts! (Date & Venue to be announced)"
                        delay="1s"
                    />

                    <div className="mt-8 bg-yellow-100 p-4 border-2 border-black rotate-1 animate-pulse shadow-[4px_4px_0px_black]">
                        <p className="font-bold text-center text-sm">
                            💡 Tip: Don't ghost your child! Be the Santa you wish you had.
                        </p>
                    </div>

                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-[#FFD700] text-black text-xl font-black py-4 border-4 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] active:translate-y-[2px] active:shadow-none transition-all uppercase tracking-wider sticky bottom-0"
                >
                    Got It! Let's Go!
                </button>

            </div>
        </div>
    );
}
