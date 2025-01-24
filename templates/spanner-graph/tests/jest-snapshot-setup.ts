const { configureToMatchImageSnapshot } = require('jest-image-snapshot');

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  runInProcess: true,
});
expect.extend({ toMatchImageSnapshot });