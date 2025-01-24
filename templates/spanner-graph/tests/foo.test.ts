/**
 * @jest-environment puppeteer
 */

const {ServeFrontend, MockBackend} = require('./serve-content');

describe('Hello World', () => {
    it('should run a test', () => {
        expect(true).toBe(true);
    });
});

describe('Snapshot', () => {
    let frontend;
    let backend;

    beforeAll(async () => {
        frontend = new ServeFrontend(8080);
        frontend.start();

        backend = new MockBackend();
        backend.start();
    });

    afterAll(async () => {
        await frontend.stop();
        await backend.stop();
    });

    it('should take a snapshot', async () => {
        await page.goto('http://localhost:8080/test.html');
        await expect(page.title()).resolves.toMatch('Spanner Graph Visualization Tests');

        // let the graph settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Take screenshot
        const image = await page.screenshot();

        // Compare with baseline
        expect(Buffer.from(image)).toMatchImageSnapshot({
            failureThreshold: 0.05,
            failureThresholdType: 'percent'
        });
    });
});