// Hide console messages upon improper instantiations during tests
if (process.env.SUPRESS_LOGS) {
    global.console = {
        ...global.console,
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}
