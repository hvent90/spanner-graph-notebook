/**
 * @jest-environment puppeteer
 */

const {ServeFrontend} = require('../serve-content.js')

describe('Hello World', () => {
    it('should run a test', () => {
        expect(true).toBe(true);
    });
});

describe('Main Application Flow', () => {
    beforeEach(async () => {
        await page.goto(`http://localhost:${ServeFrontend.port}/static/test.html`);

        // let the graph settle
        await new Promise(resolve => setTimeout(resolve, 2000));
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