import React, { useState } from 'react';
import { adminApi, setAdminToken } from '../../lib/api';
import ChristmasBackground from '../common/ChristmasBackground';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { token } = await adminApi.login({ username, password });
            setAdminToken(token);
            window.location.href = '/admin'; // Redirect to dashboard
        } catch (err: any) {
            console.error(err);
            setError('Invalid Credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono relative overflow-hidden">
            <ChristmasBackground />

            <div className="relative z-10 w-full max-w-sm">
                <div className="bg-white border-4 border-[#C41E3A] p-8 shadow-[8px_8px_0px_0px_#C41E3A]">
                    <div className="text-center mb-8">
                        <span className="text-4xl">🔐</span>
                        <h1 className="text-2xl font-black uppercase mt-2 text-[#C41E3A]">Admin Access</h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Authorized Elf Personnel Only</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 mb-4 text-sm font-bold text-center uppercase">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Username</label>
                            <input
                                type="text"
                                className="w-full border-2 border-black p-3 font-bold focus:shadow-[4px_4px_0px_0px_black] outline-none transition-all"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full border-2 border-black p-3 font-bold focus:shadow-[4px_4px_0px_0px_black] outline-none transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-[#C41E3A] text-white font-black uppercase py-4 border-2 border-black shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] transition-all disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Unlock Console'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a href="/" className="text-xs font-bold text-gray-400 hover:text-black uppercase underline">Return to Main Site</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
