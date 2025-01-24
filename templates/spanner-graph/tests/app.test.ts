/**
 * @jest-environment puppeteer
 */

const {ServeFrontend, MockBackend} = require('./serve-content');

describe('Hello World', () => {
    it('should run a test', () => {
        expect(true).toBe(true);
    });
});

describe('Main Application Flow', () => {
    let frontend: typeof ServeFrontend;
    let backend: typeof MockBackend;

    beforeAll(async () => {
        frontend = new ServeFrontend(8080);
        frontend.start();

        backend = new MockBackend();
        backend.start();
    });

    beforeEach(async () => {
        await page.goto('http://localhost:8080/test.html');

        // let the graph settle
        await new Promise(resolve => setTimeout(resolve, 2000));
    })

    afterAll(async () => {
        await frontend.stop();
        await backend.stop();
    });

    it('should show the graph', async () => {
        const image = await page.screenshot();
        expect(Buffer.from(image)).toMatchImageSnapshot({
            failureThreshold: 0.05,
            failureThresholdType: 'percent'
        });
    });

    it('should switch to table view', async () => {
        // Click the table button in the top menu
        await page.evaluate(() => {
            const button: HTMLButtonElement | null = document.querySelector('#view-table')
            if (button) {
                button.click();
            }
        });

        const image = await page.screenshot();
        expect(Buffer.from(image)).toMatchImageSnapshot({
            failureThreshold: 0.05,
            failureThresholdType: 'percent'
        });
    });

    it('should switch to schema view', async () => {
        // Click the schema button in the top menu
        await page.evaluate(() => {
            const button: HTMLButtonElement | null = document.querySelector('#view-schema')
            if (button) {
                button.click();
            }
        });

        const image = await page.screenshot();
        expect(Buffer.from(image)).toMatchImageSnapshot({
            failureThreshold: 0.05,
            failureThresholdType: 'percent'
        });
    });
});