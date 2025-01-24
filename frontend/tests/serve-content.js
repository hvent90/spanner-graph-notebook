const http = require('http');
const httpServer = require('http-server');
const fs = require('fs');
const path = require('path');

class ServeFrontend {
    port = 8080;

    constructor(port = 8080) {
        this.port = port;

        // Add process exit handlers
        process.on('exit', this._cleanup.bind(this));
        process.on('SIGINT', this._cleanup.bind(this));
        process.on('SIGTERM', this._cleanup.bind(this));
    }

    _cleanup() {
        if (this.server) {
            this.server.close();
            console.log('Frontend Server stopped during process exit');
        }
    }

    start() {
        return new Promise((resolve) => {
            this.server = httpServer.createServer({
                port: this.port,
                cache: -1,  // Disable caching
                root: './'  // Serve from root directory
            });

            this.server.listen(8080, () => {
                console.log('Frontend content is served at http://localhost:8080/static/test.html');
            });
        });
    }

    stop() {
        this.server.close();
    }
}

class MockBackend {
    port = 8195;

    constructor(port = 8195) {
        this.server = null;
        this.port = port;

        // Load mock data
        const mockDataPath = path.join(__dirname, './mock-data.json');
        this.mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

        // Add process exit handlers
        process.on('exit', this._cleanup.bind(this));
        process.on('SIGINT', this._cleanup.bind(this));
        process.on('SIGTERM', this._cleanup.bind(this));
    }

    _cleanup() {
        if (this.server) {
            this.server.close();
            console.log('Mock Server stopped during process exit');
        }
    }

    _handleRequest(req, res) {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Route requests
        if (req.method === 'GET' && req.url === '/get_ping') {
            this._handlePing(req, res);
        } else if (req.method === 'POST' && req.url === '/post_query') {
            this._handleQuery(req, res);
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({error: 'Not found'}));
        }
    }

    _handlePing(req, res) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({status: 'ok', message: 'Mock server is running'}));
    }

    _handleQuery(req, res) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(this.mockData));
        });
    }

    start() {
        return new Promise((resolve) => {
            this.server = http.createServer(this._handleRequest.bind(this));
            this.server.listen(this.port, () => {
                console.log(`Mock Spanner server running at http://localhost:${this.port}`);
                resolve();
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('Mock Spanner server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// Export the MockServer class
module.exports = {ServeFrontend, MockBackend};

// Check if this file is being run directly
if (require.main === module) {
    const frontend = new ServeFrontend(8080);
    frontend.start();

    const backend = new MockBackend();
    backend.start();

    // Handle process termination
    process.on('SIGINT', async () => {
        await frontend.stop();
        await backend.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await frontend.stop();
        await backend.stop();
        process.exit(0);
    });
}