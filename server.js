const express = require('express');
const { execFile } = require('child_process');

const app = express();

const PORT = Number(process.env.PORT || 8080);
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error('ERROR: API_KEY is not configured');
    process.exit(1);
}

// Health check: no API key required.
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Require API key for all endpoints below this point.
app.use((req, res, next) => {
    const suppliedKey = req.get('X-API-Key');

    if (!suppliedKey || suppliedKey !== API_KEY) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing API Key'
        });
    }

    next();
});

app.get('/market/pairs', (req, res) => {
    execFile(
        'docker',
        [
            'exec',
            'utopia',
            'curl',
            '-sS',
            '--fail',
            '--max-time',
            '15',
            '--socks5-hostname',
            '127.0.0.1:1984',
            'http://crp:8182/market/pairs'
        ],
        {
            timeout: 20000,
            maxBuffer: 5 * 1024 * 1024
        },
        (error, stdout, stderr) => {
            if (error) {
                console.error('Market pairs request failed:', stderr || error.message);
                return res.status(502).json({
                    error: 'Bad Gateway',
                    message: 'Cannot retrieve market pairs'
                });
            }

            try {
                return res.json(JSON.parse(stdout));
            } catch {
                return res.status(502).json({
                    error: 'Invalid upstream JSON response'
                });
            }
        }
    );
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`CRP API listening on port ${PORT}`);
});
