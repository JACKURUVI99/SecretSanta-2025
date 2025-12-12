import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
// Helper to parse JWT
function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}
export default function AuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('Processing login...');
    const [error, setError] = useState('');
    const effectRan = useRef(false);
    useEffect(() => {
        if (effectRan.current === true) return;
        effectRan.current = true;
        const handleCallback = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                if (!code) {
                    throw new Error('No authorization code found');
                }
                const clientId = import.meta.env.VITE_DAUTH_CLIENT_ID;
                const redirectUri = import.meta.env.VITE_DAUTH_REDIRECT_URI;
                if (!clientId || !redirectUri) {
                    throw new Error('Missing DAuth configuration');
                }
                // 1. Exchange code for token (Call our own Secure Proxy)
                setStatus('Exchanging code for token...');
                const tokenResponse = await fetch('/api/dauth/oauth/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: clientId,
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: redirectUri,
                    }).toString(),
                });
                if (!tokenResponse.ok) {
                    const errText = await tokenResponse.text();
                    throw new Error(`Token exchange failed: ${errText}`);
                }
                const tokenData = await tokenResponse.json();
                const accessToken = tokenData.access_token;
                const idToken = tokenData.id_token;
                let userData;
                if (idToken) {
                    const decoded = parseJwt(idToken);
                    if (decoded && decoded.email) {
                        console.log("⚡ Optimized Login: Using ID Token data");
                        userData = {
                            email: decoded.email,
                            name: decoded.name || decoded.given_name || decoded.email.split('@')[0],
                            id: decoded.sub || decoded.id
                        };
                    }
                }
                // Fallback: Fetch User Info if ID Token didn't work (SLOW PATH)
                if (!userData) {
                    setStatus('Fetching user profile...');
                    const userResponse = await fetch('/api/dauth/resources/user', {
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        },
                        method: 'GET'
                    });
                    if (!userResponse.ok) {
                        throw new Error('Failed to fetch user info');
                    }
                    userData = await userResponse.json();
                }
                // 3. Sync with Supabase
                setStatus('Syncing with Supabase...');
                const email = userData.email;
                const dummyPassword = `DAuth_${userData.id || email}_Secure`;
                let authUser;
                // Extract roll number from email
                const rollNumber = email.split('@')[0];
                // ✅ VALIDATE: Only EEE'28 students (roll numbers starting with 107124)
                if (!rollNumber.startsWith('107124')) {
                    setError('🎓 This Secret Santa event is exclusively for EEE\'28 students.\n\nOnly students with roll numbers starting with 107124 are eligible to participate.\n\nThank you for your understanding! 🎅');
                    setStatus('');
                    return;
                }
                // Try to sign in first
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password: dummyPassword,
                });
                if (signInError) {
                    console.log('Sign in failed:', signInError.message);
                    setStatus(`Sign in failed (${signInError.message}). Trying sign up...`);
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email,
                        password: dummyPassword,
                        options: {
                            data: {
                                name: userData.name,
                                roll_number: email.split('@')[0],
                            }
                        }
                    });
                    if (signUpError) {
                        if (signUpError.message.includes("already registered") || signUpError.status === 400) {
                            throw new Error(`Account exists but login failed. Password mismatch? (${signUpError.message})`);
                        }
                        throw signUpError;
                    }
                    authUser = signUpData.user;
                } else {
                    authUser = signInData.user;
                }
                if (!authUser) {
                    throw new Error("Authentication failed. No user returned.");
                }
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: authUser.id,
                        name: userData.name,
                        roll_number: email.split('@')[0],
                        // points: 0, // CRITICAL FIX: Do NOT reset points on login!
                        favorite_emoji: '🎅',
                    }, { onConflict: 'id' });
                if (profileError) {
                    console.error('Profile sync error (non-fatal):', profileError);
                }
                // 4. Redirect to home
                setStatus('Login Successful! Redirecting...');
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            } catch (err: any) {
                console.error('DAuth Callback Error:', err);
                setError(err.message || 'An error occurred during DAuth login');
                setStatus('');
            }
        };
        handleCallback();
    }, []);
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h2 className="text-2xl font-bold mb-4 text-blue-600">Delta Force Auth</h2>
                {error ? (
                    <div className="text-red-500 bg-red-50 p-4 rounded mb-4">
                        {error}
                        <div className="mt-4">
                            <a href="/" className="text-blue-500 hover:underline">Return to Login</a>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-600 animate-pulse">{status}</div>
                )}
            </div>
        </div>
    );
}
