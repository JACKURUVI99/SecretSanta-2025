import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DAUTH_PUBLIC_KEY = process.env.DAUTH_PUBLIC_KEY;
// If using Supabase Tokens, we might verify using Supabase's JWT Secret or getUser()
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://secretsantanitt25.site',
        'https://www.secretsantanitt25.site'
    ],
    credentials: true
}));
app.use(express.json());

// ... (rest of middlewares)

// REMOVED STATIC SERVING (Frontend is separate)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const DIST_DIR = path.join(__dirname, 'dist');
// app.use(express.static(DIST_DIR));
// app.get(/.*/, (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));

app.listen(PORT, () => console.log(`🔒 Secure Server running on port ${PORT}`));
