/**
 * @jest-environment puppeteer
 */

describe('GraphVisualization', () => {
    beforeEach(async () => {
        await page.goto('http://localhost:8080/static/test.html');
    });

    describe('Default', () => {
        beforeEach(async () => {
            await page.evaluate(() => {
                const button: HTMLButtonElement | null = document.querySelector('#view-default')
                if (button) {
                    button.click();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
        });

        it('should center on the graph with no labels', async () => {
            const image = await page.screenshot();
            expect(Buffer.from(image)).toMatchImageSnapshot({
                failureThreshold: 0.05,
                failureThresholdType: 'percent'
            });
        });

        it('should show labels and highlights for highlighted node and neighbors', async () => {
            await page.evaluate(() => {
                window.app.store.setFocusedObject(window.app.store.getNodes()[0]);
            });

            const image = await page.screenshot();
            expect(Buffer.from(image)).toMatchImageSnapshot({
                failureThreshold: 0.05,
                failureThresholdType: 'percent'
            });
        });

        it('should show labels and highlights for highlighted edge and neighbors', async () => {
            await page.evaluate(() => {
                window.app.store.setFocusedObject(window.app.store.getEdges()[0]);
            });

            const image = await page.screenshot();
            expect(Buffer.from(image)).toMatchImageSnapshot({
                failureThreshold: 0.05,
                failureThresholdType: 'percent'
            });
        });

        it('should center on a selected node', async () => {
            await page.evaluate(() => {
                window.app.store.setSelectedObject(window.app.store.getNodes()[0]);
            });

            const image = await page.screenshot();
            expect(Buffer.from(image)).toMatchImageSnapshot({
                failureThreshold: 0.05,
                failureThresholdType: 'percent'
            });
        });

        it('should center on a selected edge', async () => {
            await page.evaluate(() => {
                window.app.store.setSelectedObject(window.app.store.getEdges()[0]);
            });

            const image = await page.screenshot();
            expect(Buffer.from(image)).toMatchImageSnapshot({
                failureThreshold: 0.05,
                failureThresholdType: 'percent'
            });
        });
    });

    describe('Schema', () => {
        beforeEach(async () => {
            await page.evaluate(() => {
                const button: HTMLButtonElement | null = document.querySelector('#view-schema')
                if (button) {
                    button.click();
                }
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
        });

        it('should center on the graph with labels shown', async () => {
            const image = await page.screenshot();
            expect(Buffer.from(image)).toMatchImageSnapshot({
                failureThreshold: 0.05,
                failureThresholdType: 'percent'
            });
        });
    });
});