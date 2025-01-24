const {configureToMatchImageSnapshot} = require('jest-image-snapshot');

if (process.env.SUPRESS_LOGS) {
    global.console = {
        ...global.console,
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}

const toMatchImageSnapshot = configureToMatchImageSnapshot({
    runInProcess: true,
});
expect.extend({toMatchImageSnapshot});