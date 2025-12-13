
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

const PORT = process.env.PORT || 8080;

const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // API Proxy: /api/dauth/oauth/token
    if (req.url === '/api/dauth/oauth/token' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { code, redirect_uri, client_id, grant_type } = JSON.parse(body);
                const clientSecret = process.env.VITE_DAUTH_CLIENT_SECRET || process.env.DAUTH_CLIENT_SECRET;

                if (!clientSecret) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Server misconfigured: missing secret' }));
                    return;
                }

                const tokenResponse = await fetch('https://auth.delta.nitt.edu/api/oauth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id,
                        client_secret: clientSecret,
                        grant_type: grant_type || 'authorization_code',
                        code,
                        redirect_uri
                    })
                });

                const data = await tokenResponse.json();
                res.writeHead(tokenResponse.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            } catch (e) {
                console.error(e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // API Proxy: /api/dauth/resources/user
    if (req.url === '/api/dauth/resources/user' && req.method === 'POST') {
        const authHeader = req.headers['authorization'];
        try {
            const userResponse = await fetch('https://auth.delta.nitt.edu/api/resources/user', {
                method: 'POST',
                headers: { 'Authorization': authHeader || '' }
            });
            const data = await userResponse.json();
            res.writeHead(userResponse.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (e) {
            console.error(e);
            res.writeHead(500);
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // Static File Serving
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

    // SPA Fallback: If file doesn't exist, serve index.html
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpg'; break;
        case '.svg': contentType = 'image/svg+xml'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                // Fallback to index.html again just in case path logic missed it
                fs.readFile(path.join(DIST_DIR, 'index.html'), (err, indexContent) => {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(indexContent, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Minimal Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});
