const serverless = require('serverless-http');
const app = require('../../backend/dist/app').default || require('../../backend/dist/app');

module.exports = serverless(app);
