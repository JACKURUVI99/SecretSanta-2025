import { useState } from 'react';
import { Shield, AlertTriangle, Check, Trash2, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface TermsModalProps {
    onAccepted: () => void;
}

export default function TermsModal({ onAccepted }: TermsModalProps) {
    const { logout } = useAuth();
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);

    const handleAccept = async () => {
        if (!accepted) return;
        setLoading(true);
        try {
            await api.acceptTerms();
            onAccepted();
        } catch (e) {
            console.error(e);
            alert("Failed to accept terms. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!window.confirm("WARNING: Declining will ERRASE your account and data permanently. You will be logged out. Are you sure?")) {
            return;
        }
        setIsDeclining(true);
        try {
            await api.declineTerms();
            await logout();
        } catch (e) {
            console.error(e);
            alert("Failed to decline/delete account.");
        } finally {
            setIsDeclining(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="bg-[#C41E3A] text-white p-4 border-b-4 border-black flex items-center gap-3">
                    <Shield size={32} strokeWidth={2.5} />
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-wide">Official Participation Rules</h2>
                        <p className="font-bold text-xs opacity-90 text-yellow-300">Secret Santa 2025 Edition</p>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto space-y-6 font-medium text-gray-800 leading-relaxed bg-yellow-50/50">
                    <div className="bg-blue-100 border-l-4 border-blue-500 p-4 font-bold text-blue-900 shadow-sm">
                        <p>🎉 The Game is Officially Starting! Please read the rules carefully before joining.</p>
                    </div>

                    <div className="space-y-4">
                        <section>
                            <h3 className="font-black text-lg uppercase mb-2 flex items-center gap-2">
                                <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                                The Assignment
                            </h3>
                            <p>
                                You will be assigned a <strong>"Child"</strong> (Giftee) from your batch. You are their Secret Santa.
                                Simultaneously, someone else has been assigned to YOU as your Secret Santa.
                            </p>
                        </section>

                        <section>
                            <h3 className="font-black text-lg uppercase mb-2 flex items-center gap-2">
                                <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
                                The Mission
                            </h3>
                            <p>
                                Your goal is to buy a secret gift for your assigned Child.
                                Keep your identity hidden until the <strong>Reveal Day</strong>!
                                Use the anonymous chat to tease them or ask for preferences.
                            </p>
                        </section>

                        <section>
                            <h3 className="font-black text-lg uppercase mb-2 flex items-center gap-2">
                                <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span>
                                Reveal Day
                            </h3>
                            <p>
                                We will NOT be having a traditional party. Instead, on Reveal Day, we will gather to simply reveal identities and exchange gifts.
                                Details on the exact time/venue will be shared by Admins.
                            </p>
                        </section>

                        <section>
                            <h3 className="font-black text-lg uppercase mb-2 flex items-center gap-2">
                                <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">4</span>
                                Zero Tolerance
                            </h3>
                            <p>
                                By joining, you commit to participating fully. <strong>ghosting</strong> your Child (not getting a gift) is strictly prohibited and ruins the fun.
                                Inappropriate behavior in anonymous chats will result in an immediate ban.
                            </p>
                        </section>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-400 pt-4">
                        <label className="flex items-start gap-3 cursor-pointer p-2 hover:bg-gray-100 rounded transition-colors group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    className="peer h-6 w-6 border-2 border-black rounded-none cursor-pointer appearance-none checked:bg-[#00A86B] transition-all"
                                    checked={accepted}
                                    onChange={(e) => setAccepted(e.target.checked)}
                                />
                                <Check size={16} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                            </div>
                            <span className="text-sm font-bold pt-0.5 group-hover:text-black">
                                I have read and agree to the Rules & Regulations. I promise to be a good Secret Santa! 🎅
                            </span>
                        </label>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 border-t-4 border-black bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <button
                        onClick={handleDecline}
                        disabled={loading || isDeclining}
                        className="text-red-500 font-bold text-xs uppercase hover:underline hover:text-red-700 flex items-center gap-1 order-2 sm:order-1"
                    >
                        <Trash2 size={14} />
                        {isDeclining ? "Erasing Data..." : "Decline & Delete Account"}
                    </button>

                    <button
                        onClick={handleAccept}
                        disabled={!accepted || loading || isDeclining}
                        className={`
                            order-1 sm:order-2 w-full sm:w-auto px-8 py-3 font-black uppercase text-lg border-2 border-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_black] transition-all
                            ${accepted && !loading
                                ? 'bg-[#00A86B] text-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] active:translate-y-0 active:shadow-none'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        {loading ? "Joining..." : "Join Game"}
                    </button>
                </div>
            </div>
        </div>
    );
}
