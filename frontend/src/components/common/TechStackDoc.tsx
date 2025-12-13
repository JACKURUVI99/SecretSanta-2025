
import { Database, Server, Globe, Cpu, Layout, Cloud, Shield, Lock, FileCode, ArrowDown, ArrowRight, Folder, File, Code, Terminal, Printer, Gamepad2, Layers, Box } from 'lucide-react';
import ChristmasBackground from './ChristmasBackground';

export default function TechStackDoc() {
    return (
        <div className="min-h-screen bg-[#C41E3A] font-mono p-8 print:p-0 print:bg-white text-black relative">
            {/* Hide background in print */}
            <div className="print:hidden">
                <ChristmasBackground />
            </div>

            {/* Print Button (Floating) */}
            <button
                onClick={() => window.print()}
                className="fixed bottom-8 right-8 bg-black text-white p-4 rounded-full shadow-[4px_4px_0px_white] hover:-translate-y-1 transition-all print:hidden z-50 flex items-center gap-2 font-bold uppercase border-2 border-white"
            >
                <Printer size={24} /> Download PDF
            </button>

            <div className="max-w-5xl mx-auto bg-white border-8 border-black shadow-[16px_16px_0px_0px_black] p-8 relative print:shadow-none print:border-none print:w-full">
                {/* Header */}
                <div className="border-b-8 border-black pb-6 mb-8 text-center print:border-b-4">
                    <h1 className="text-5xl font-black uppercase font-mountains tracking-wider mb-2">Secret Santa 2025</h1>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <span className="bg-black text-white px-3 py-1 font-bold text-xs uppercase">NIT Trichy Edition</span>
                    </div>
                    <h2 className="text-2xl font-bold uppercase bg-black text-white inline-block px-4 py-1">Technical Architecture & Stack</h2>
                </div>

                {/* 1. Technology Stack (Detailed) */}
                <section className="mb-12 print:mb-8">
                    <h3 className="text-3xl font-black uppercase mb-6 flex items-center gap-3 border-l-8 border-[#00A86B] pl-4">
                        <Cpu size={32} /> Technology Stack
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Frontend */}
                        <div className="border-4 border-black p-4 bg-blue-50">
                            <div className="flex items-center gap-2 mb-2 border-b-2 border-black pb-1">
                                <Layout size={20} className="text-blue-600" />
                                <span className="font-black uppercase">Frontend</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#61DAFB] rounded-full border border-black font-black text-[10px]">Rc</div>
                                    <div>
                                        <div className="font-bold text-sm">React 18</div>
                                        <div className="text-[10px] text-gray-500">Component Lib</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#3178C6] text-white rounded-full border border-black font-black text-[10px]">TS</div>
                                    <div>
                                        <div className="font-bold text-sm">TypeScript</div>
                                        <div className="text-[10px] text-gray-500">Static Typing</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#38B2AC] text-white rounded-full border border-black font-black text-[10px]">TW</div>
                                    <div>
                                        <div className="font-bold text-sm">Tailwind</div>
                                        <div className="text-[10px] text-gray-500">Utility CSS</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#646CFF] text-white rounded-full border border-black font-black text-[10px]">Vt</div>
                                    <div>
                                        <div className="font-bold text-sm">Vite</div>
                                        <div className="text-[10px] text-gray-500">Build Tool</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Backend */}
                        <div className="border-4 border-black p-4 bg-green-50">
                            <div className="flex items-center gap-2 mb-2 border-b-2 border-black pb-1">
                                <Server size={20} className="text-green-600" />
                                <span className="font-black uppercase">Backend</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#339933] text-white rounded-full border border-black font-black text-[10px]">Nd</div>
                                    <div>
                                        <div className="font-bold text-sm">Node.js</div>
                                        <div className="text-[10px] text-gray-500">Runtime</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full border border-black font-black text-[10px]">Ex</div>
                                    <div>
                                        <div className="font-bold text-sm">Express</div>
                                        <div className="text-[10px] text-gray-500">Web Protocol</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#009639] text-white rounded-full border border-black font-black text-[10px]">Ng</div>
                                    <div>
                                        <div className="font-bold text-sm">Nginx</div>
                                        <div className="text-[10px] text-gray-500">Reverse Proxy</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Database & Auth */}
                        <div className="border-4 border-black p-4 bg-yellow-50">
                            <div className="flex items-center gap-2 mb-2 border-b-2 border-black pb-1">
                                <Database size={20} className="text-yellow-600" />
                                <span className="font-black uppercase">Data Layer</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#3ECF8E] text-black rounded-full border border-black font-black text-[10px]">Sb</div>
                                    <div>
                                        <div className="font-bold text-sm">Supabase</div>
                                        <div className="text-[10px] text-gray-500">BaaS Provider</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#336791] text-white rounded-full border border-black font-black text-[10px]">PG</div>
                                    <div>
                                        <div className="font-bold text-sm">PostgreSQL</div>
                                        <div className="text-[10px] text-gray-500">Relational DB</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#4285F4] text-white rounded-full border border-black font-black text-[10px]">DA</div>
                                    <div>
                                        <div className="font-bold text-sm">Delta Auth</div>
                                        <div className="text-[10px] text-gray-500">Auth Platform</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DevOps */}
                        <div className="border-4 border-black p-4 bg-red-50">
                            <div className="flex items-center gap-2 mb-2 border-b-2 border-black pb-1">
                                <Cloud size={20} className="text-red-600" />
                                <span className="font-black uppercase">DevOps</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#4285F4] text-white rounded-full border border-black font-black text-[10px]">GCP</div>
                                    <div>
                                        <div className="font-bold text-sm">Cloud Run</div>
                                        <div className="text-[10px] text-gray-500">Serverless</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-[#0db7ed] text-white rounded-full border border-black font-black text-[10px]">Dk</div>
                                    <div>
                                        <div className="font-bold text-sm">Docker</div>
                                        <div className="text-[10px] text-gray-500">Containerization</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full border border-black font-black text-[10px]">SH</div>
                                    <div>
                                        <div className="font-bold text-sm">Bash</div>
                                        <div className="text-[10px] text-gray-500">Auto-Deploy</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 1.5. Game Overview & Theory (Non-Technical) */}
                <section className="mb-12 print:mb-8 break-inside-avoid">
                    <h3 className="text-3xl font-black uppercase mb-6 flex items-center gap-3 border-l-8 border-[#3B82F6] pl-4">
                        <Globe size={32} /> Game Theory & Logic
                    </h3>
                    <div className="border-4 border-black p-6 bg-gray-50 print:border-2 space-y-4">
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                            <h4 className="font-black uppercase text-xl border-b-2 border-gray-300 pb-2 mb-3">What is Secret Santa?</h4>
                            <p className="text-sm text-gray-800 leading-relaxed mb-2">
                                Secret Santa is a Christmas tradition where members of a group are randomly assigned a person to whom they give a gift. The identity of the gift giver is to remain a secret until the gift is opened.
                            </p>
                            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                                <li><b>Anonymity:</b> The system ensures no one knows who their Santa is until the reveal.</li>
                                <li><b>Constraint:</b> You cannot be your own Santa.</li>
                                <li><b>Cycle:</b> The algorithm ensures everyone gives and receives exactly one gift.</li>
                            </ul>
                        </div>

                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                            <h4 className="font-black uppercase text-xl border-b-2 border-gray-300 pb-2 mb-3">How the App Works (Simplified)</h4>
                            <p className="text-sm text-gray-800 leading-relaxed">
                                Unlike drawing names from a hat, this digital version uses an intelligent "Derangement" algorithm. When the admin clicks "Generate", the server shuffles all participants and links them in a chain (A &rarr; B &rarr; C &rarr; A). This guarantees a perfect loop with no leftovers.
                            </p>
                            <div className="mt-3 flex gap-4 text-xs font-bold uppercase text-gray-500">
                                <span className="bg-green-100 p-1 px-2 border border-green-300 rounded">1. Login</span>
                                <span>&rarr;</span>
                                <span className="bg-blue-100 p-1 px-2 border border-blue-300 rounded">2. Get Assigned</span>
                                <span>&rarr;</span>
                                <span className="bg-red-100 p-1 px-2 border border-red-300 rounded">3. Buy Gift</span>
                                <span>&rarr;</span>
                                <span className="bg-yellow-100 p-1 px-2 border border-yellow-300 rounded">4. Reveal</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 1.6. Comprehensive Feature Deep Dive */}
                <section className="mb-12 print:mb-8 break-inside-avoid">
                    <h3 className="text-3xl font-black uppercase mb-6 flex items-center gap-3 border-l-8 border-[#F43F5E] pl-4">
                        <Layers size={32} /> System Features
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">

                        {/* Leaderboard System */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                            <h4 className="font-black uppercase text-lg border-b-2 border-black pb-1 mb-2">🏆 Leaderboard & Economy</h4>
                            <p className="text-xs text-gray-700 mb-2">
                                The competitive element of the app driven by "Points".
                            </p>
                            <ul className="text-xs list-disc pl-4 space-y-1 font-medium">
                                <li><b>Scoring:</b> Users earn points by winning mini-games (TicTacToe, Flappy Santa) and completing daily tasks.</li>
                                <li><b>Maintenance:</b> Admins can reset scores or ban users who exploit glitches.</li>
                                <li><b>Ranking:</b> Real-time sorting based on total accumulated points.</li>
                            </ul>
                        </div>

                        {/* Chat Ecosystem */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                            <h4 className="font-black uppercase text-lg border-b-2 border-black pb-1 mb-2">💬 Communication Channels</h4>
                            <p className="text-xs text-gray-700 mb-2">
                                Dual-layer messaging system for privacy and community.
                            </p>
                            <ul className="text-xs list-disc pl-4 space-y-1 font-medium">
                                <li><b>Global Chat:</b> Public room for all batchmates to discuss and banter.</li>
                                <li><b>Santa Chat:</b> <span className="text-red-600 font-bold">Anonymous</span> 1-on-1 channel. Santa can message their Target without revealing identity (displayed as "Santa").</li>
                            </ul>
                        </div>

                        {/* Engagement Tools */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                            <h4 className="font-black uppercase text-lg border-b-2 border-black pb-1 mb-2">📊 Polls & Tasks</h4>
                            <p className="text-xs text-gray-700 mb-2">
                                Daily content to keep users returning.
                            </p>
                            <ul className="text-xs list-disc pl-4 space-y-1 font-medium">
                                <li><b>Admin Polls:</b> Admins create binary or multi-choice questions. Real-time stats.</li>
                                <li><b>Bonus Tasks:</b> "Find X person", "Take a selfie". Verified manually or via keywords.</li>
                            </ul>
                        </div>

                        {/* Admin Control */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                            <h4 className="font-black uppercase text-lg border-b-2 border-black pb-1 mb-2">🛡️ Admin God Mode</h4>
                            <p className="text-xs text-gray-700 mb-2">
                                Complete control over the game state.
                            </p>
                            <ul className="text-xs list-disc pl-4 space-y-1 font-medium">
                                <li><b>Maintenance Mode:</b> Lock the app for updates.</li>
                                <li><b>Force Reveal:</b> Trigger the final event where everyone sees their Santa.</li>
                                <li><b>User Management:</b> Ban/Unban, Edit Profiles, Reset Passwords.</li>
                            </ul>
                        </div>

                    </div>
                </section>

                {/* 2. File Structure (Visual Tree) */}
                <section className="mb-12 print:mb-8 break-inside-avoid">
                    <h3 className="text-3xl font-black uppercase mb-6 flex items-center gap-3 border-l-8 border-black pl-4">
                        <Folder size={32} /> Project Structure
                    </h3>
                    <div className="bg-[#1e1e1e] text-green-400 p-6 border-4 border-black font-mono text-sm shadow-[8px_8px_0px_0px_gray] overflow-hidden">
                        <pre className="whitespace-pre">
                            {`root/
├── 📂 backend/                 # Node.js/Express Server
│   ├── 📄 server.mjs           # Entry Point & API Routes
│   ├── 📄 Dockerfile           # Backend Container Config
│   └── 📄 package.json         # Backend Deps
│
├── 📂 frontend/                # React Vite App
│   ├── 📂 public/              # Static Assets (Manifest, Icons)
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── 📂 admin/       # Dashboard, Analysis Tools
│   │   │   ├── 📂 games/       # TicTacToe, Flappy Santa Logic
│   │   │   ├── 📂 features/    # Chat, Profile, Leaderboard
│   │   │   └── 📂 common/      # Backgrounds, UI Modals
│   │   ├── 📂 contexts/        # AuthProvider (Global State)
│   │   ├── 📂 lib/             # API & Supabase Clients
│   │   ├── 📄 App.tsx          # Main Router
│   │   └── 📄 main.tsx         # React DOM Root
│   └── 📄 Dockerfile           # Multi-stage Frontend Build
│
├── 📂 database/                # SQL Schemas & Fixes
│   ├── 📄 FINAL_FIX_V3.sql     # Core Schema Definition
│   └── 📄 ADD_NEW_GAMES.sql    # Game Tables
│
├── 📂 scripts/                 # Maintenance Scripts
│   └── 📄 execute_sql.js       # Admin SQL Runner
│
├── 📄 deploy_gcp.sh            # Production Deployment Script
└── 📄 docker-compose.yml       # Local Development Orchestration`}
                        </pre>
                    </div>
                </section>

                {/* 3. Detailed Request Lifecycle */}
                <section className="mb-12 print:mb-8 break-inside-avoid">
                    <h3 className="text-3xl font-black uppercase mb-6 flex items-center gap-3 border-l-8 border-[#FFD700] pl-4">
                        <Globe size={32} /> Request Lifecycle
                    </h3>

                    <div className="border-4 border-black p-6 bg-gray-50 print:border-2 space-y-8">
                        {/* Flowchart Layout */}
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 border-4 border-black bg-white p-4 relative z-10 w-full min-h-[100px]">
                                <span className="absolute -top-3 left-4 bg-black text-white px-2 text-xs font-bold uppercase">1. Client</span>
                                <div className="font-black uppercase flex items-center gap-2"><Layout size={18} /> Browser / PWA</div>
                                <div className="text-xs mt-1 text-gray-600">User initiates HTTPS Request. Service Worker intercepts PWA requests.</div>
                            </div>
                            <ArrowRight size={32} className="hidden md:block" />
                            <ArrowDown size={32} className="md:hidden block" />

                            <div className="flex-1 border-4 border-black bg-gray-200 p-4 relative w-full min-h-[100px]">
                                <span className="absolute -top-3 left-4 bg-gray-500 text-white px-2 text-xs font-bold uppercase">2. Load Balancer</span>
                                <div className="font-black uppercase flex items-center gap-2"><Cloud size={18} /> TCP/IP Layer</div>
                                <div className="text-xs mt-1 text-gray-600">Routes traffic to Cloud Run service instance. Terminates SSL.</div>
                            </div>
                            <ArrowRight size={32} className="hidden md:block" />
                            <ArrowDown size={32} className="md:hidden block" />

                            <div className="flex-1 border-4 border-black bg-[#E0E7FF] p-4 relative w-full min-h-[100px]">
                                <span className="absolute -top-3 left-4 bg-indigo-600 text-white px-2 text-xs font-bold uppercase">3. Nginx Reverse Proxy</span>
                                <div className="font-black uppercase flex items-center gap-2"><Server size={18} /> Frontend Cont.</div>
                                <div className="text-xs mt-1 text-gray-600">
                                    - Matches <code>/api/*</code> &rarr; <code>localhost:3000</code>
                                    - Matches <code>/</code> &rarr; <code>index.html</code> (SPA)
                                </div>
                            </div>
                        </div>

                        {/* Backend Processing */}
                        <div className="border-4 border-dashed border-gray-400 p-6 relative bg-[#FECACA]">
                            <span className="absolute -top-3 left-4 bg-red-600 text-white px-2 text-xs font-bold uppercase">4. Backend Container (Node.js/Express)</span>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_black]">
                                    <div className="font-bold text-sm uppercase mb-1 flex items-center gap-2"><Shield size={14} /> 1. Middleware</div>
                                    <p className="text-xs text-gray-600 mb-2">Filters every request.</p>
                                    <ul className="text-xs list-disc pl-4">
                                        <li><b>CORS</b>: Allows frontend origin.</li>
                                        <li><b>Compression</b>: Gzip responses.</li>
                                        <li><b>Logging</b>: Tracks stats.</li>
                                    </ul>
                                </div>
                                <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_black]">
                                    <div className="font-bold text-sm uppercase mb-1 flex items-center gap-2"><Lock size={14} /> 2. Auth Layer</div>
                                    <p className="text-xs text-gray-600 mb-2">Secures endpoints.</p>
                                    <ul className="text-xs list-disc pl-4">
                                        <li><b>JWT</b>: Decodes <code>sb-auth-token</code>.</li>
                                        <li><b>Role Guard</b>: Checks <code>is_admin</code>.</li>
                                        <li><b>DeltaAuth</b>: Handles OAuth Code.</li>
                                    </ul>
                                </div>
                                <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_black]">
                                    <div className="font-bold text-sm uppercase mb-1 flex items-center gap-2"><FileCode size={14} /> 3. Controllers</div>
                                    <p className="text-xs text-gray-600 mb-2">Executes Logic.</p>
                                    <ul className="text-xs list-disc pl-4">
                                        <li><b>Pairing</b>: Bucket Logic Execution.</li>
                                        <li><b>Proxy</b>: <code>supabase.from().select()</code></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Technical Implementation of Games */}
                <section className="mb-12 print:mb-8 break-inside-avoid">
                    <h3 className="text-3xl font-black uppercase mb-6 flex items-center gap-3 border-l-8 border-[#9333EA] pl-4">
                        <Gamepad2 size={32} /> Game Logic Mechanics
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">

                        {/* Tic Tac Toe */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                            <div className="flex items-center gap-2 border-b-4 border-black pb-2 mb-2">
                                <Box className="text-blue-600" size={24} />
                                <h4 className="font-black uppercase text-xl">Tic-Tac-Toe Engine</h4>
                            </div>
                            <p className="text-sm font-bold mb-2 text-gray-700">Type: Client-Side State Machine</p>
                            <div className="text-sm space-y-2">
                                <p>1. <b>Minimax Algorithm (AI)</b>: The Hard difficulty uses recursive Minimax to calculate the optimal move by simulating all possible future states.</p>
                                <p>2. <b>State Management</b>: Uses a 1D array <code>[null, 'X', 'O', ...]</code> mapped to a 3x3 grid.</p>
                                <p>3. <b>Win Detection</b>: Checks 8 preset winning bitmasks (rows, cols, diags) on every move.</p>
                            </div>
                        </div>

                        {/* Flappy Santa */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                            <div className="flex items-center gap-2 border-b-4 border-black pb-2 mb-2">
                                <Layers className="text-red-600" size={24} />
                                <h4 className="font-black uppercase text-xl">Flappy Santa Engine</h4>
                            </div>
                            <p className="text-sm font-bold mb-2 text-gray-700">Type: HTML5 Canvas Loop</p>
                            <div className="text-sm space-y-2">
                                <p>1. <b>Game Loop</b>: Runs via <code>requestAnimationFrame</code> (~60fps).</p>
                                <p>2. <b>Physics</b>: Gravity constant (0.6) applied to Y-velocity each frame. Jump sets negative velocity.</p>
                                <p>3. <b>Collision</b>: AABB (Axis-Aligned Bounding Box) detection checks interaction between Santa sprite and Pipe rectangles.</p>
                            </div>
                        </div>

                        {/* Pairing Logic */}
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_black] col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 border-b-4 border-black pb-2 mb-2">
                                <Terminal className="text-green-600" size={24} />
                                <h4 className="font-black uppercase text-xl">Secret Santa Algorithm</h4>
                            </div>
                            <p className="text-sm font-bold mb-2 text-gray-700">Type: Graph Theory (Dearrangement)</p>
                            <div className="text-xs md:text-sm space-y-2 font-mono bg-gray-100 p-2 border-2 border-gray-300">
                                <code>
                                    function generatePairings(users) &#123;<br />
                                    &nbsp;&nbsp;1. Filter valid (non-banned).<br />
                                    &nbsp;&nbsp;2. Shuffle Array (Fisher-Yates).<br />
                                    &nbsp;&nbsp;3. Create Graph Nodes.<br />
                                    &nbsp;&nbsp;4. Link Node[i] &rarr; Node[i+1].<br />
                                    &nbsp;&nbsp;5. Link Last Node &rarr; First Node (Cycle).<br />
                                    &nbsp;&nbsp;6. If (Constraint Violation) &#123; Backtrack/Retry &#125;;<br />
                                    &#125;
                                </code>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Footer */}
                <div className="border-t-8 border-black pt-6 text-center print:border-t-4">
                    <div className="text-sm font-bold uppercase mb-2">Built with ❤️</div>
                    <div className="font-black text-xl">Harish Annavisamy</div>
                    <div className="text-xs text-gray-500 mt-2 print:hidden">
                        Use Browser "Print to PDF" to save this document.
                    </div>
                </div>

            </div>
        </div>
    );
}

