const http = require('http');
const httpServer = require('http-server');
const fs = require('fs');
const path = require('path');


class ServeFrontend {
    static _instance = null;
    static port = 8123;

    static getInstance() {
        if (!ServeFrontend._instance) {
            ServeFrontend._instance = new ServeFrontend();
        }

        return ServeFrontend._instance;
    }

    constructor() {
        if (ServeFrontend._instance) {
            return ServeFrontend._instance;
        }

        // Add process exit handlers
        process.on('exit', this._cleanup.bind(this));
        process.on('SIGINT', this._cleanup.bind(this));
        process.on('SIGTERM', this._cleanup.bind(this));
        
        ServeFrontend._instance = this;

        this._start();
    }

    _cleanup() {
        if (this.server) {
            this.server.close();
            console.log('Frontend Server stopped during process exit');
        }
    }

    _start() {
        return new Promise((resolve) => {
            this.server = httpServer.createServer({
                port: ServeFrontend.port,
                cache: -1,  // Disable caching
                root: './'  // Serve from root directory
            });

            this.server.listen(ServeFrontend.port, () => {
                console.log(`Frontend content is served at http://localhost:${ServeFrontend.port}/static/test.html`);
            });
        });
    }

    stop() {
        this.server.close();
    }
}

class MockBackend {
    static _instance = null;
    static port = 8195;

    static getInstance() {
        if (!MockBackend._instance) {
            MockBackend._instance = new MockBackend();
        }

        return MockBackend._instance;
    }

    constructor() {
        if (MockBackend._instance) {
            return MockBackend._instance;
        }
        this.server = null;

        // Load mock data
        const mockDataPath = path.join(__dirname, './mock-data.json');
        this.mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

        // Add process exit handlers
        process.on('exit', this._cleanup.bind(this));
        process.on('SIGINT', this._cleanup.bind(this));
        process.on('SIGTERM', this._cleanup.bind(this));

        MockBackend._instance = this;

        this._start();
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

    _start() {
        return new Promise((resolve) => {
            this.server = http.createServer(this._handleRequest.bind(this));
            this.server.listen(MockBackend.port, () => {
                console.log(`Mock Spanner server running at http://localhost:${MockBackend.port}`);
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

module.exports = {
    ServeFrontend,
    MockBackend
};

// Check if this file is being run directly
if (require.main === module) {
    const frontend = ServeFrontend.getInstance();
    const backend = MockBackend.getInstance();

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