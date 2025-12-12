import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔄 Proxy Logic for DAuth
// Vite was doing: rewrite /api/dauth -> /api on target https://auth.delta.nitt.edu
app.use('/api/dauth', async (req, res) => {
    const targetUrl = `https://auth.delta.nitt.edu/api${req.url}`;

    console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

    try {
        const options = {
            method: req.method,
            headers: {
                ...req.headers,
                host: 'auth.delta.nitt.edu', // Essential for some servers
            },
        };

        // Forward body if present
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            // Even if empty body, we might need to forward content-type
            // But usually empty body = no content type needed.
            // Check if req.body is non-empty
            if (req.body) {
                // If the client sent Form Data (x-www-form-urlencoded), we must forward it as such.
                // If the client sent JSON, we forward as JSON (unless we want to force form data for specific endpoints).

                const contentType = req.headers['content-type'] || '';

                if (contentType.includes('application/x-www-form-urlencoded')) {
                    options.body = new URLSearchParams(req.body).toString();
                    options.headers['content-type'] = 'application/x-www-form-urlencoded';
                } else {
                    options.body = JSON.stringify(req.body);
                    options.headers['content-type'] = 'application/json';
                }
            }
        }

        // Remove headers that confuse fetch/target
        delete options.headers['host']; // fetch handles host
        delete options.headers['content-length'];

        const response = await fetch(targetUrl, options);

        // Forward status and headers
        res.status(response.status);
        response.headers.forEach((val, key) => {
            res.setHeader(key, val);
        });

        const data = await response.text();
        res.send(data);

    } catch (err) {
        console.error('[Proxy Error]', err);
        res.status(500).json({ error: 'Proxy Request Failed', details: err.message });
    }
});

// 📂 Serve Static Files (Dist)
app.use(express.static(path.join(__dirname, 'dist')));

// 📱 SPA Fallback (Everything else -> index.html)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🎅 Server running on port ${PORT}`);
    console.log(`🔗 Proxying /api/dauth -> https://auth.delta.nitt.edu/api`);
});
