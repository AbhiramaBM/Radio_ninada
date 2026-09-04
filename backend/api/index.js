const serverless = require('serverless-http');

let handler;

function getApp() {
  try {
    const appModule = require('../dist/app');
    return appModule.default || appModule;
  } catch (e1) {
    try {
      require('ts-node').register({ transpileOnly: true });
      const appModule = require('../src/app');
      return appModule.default || appModule;
    } catch (e2) {
      throw new Error(`Failed to load app from dist/app or src/app: ${e1.message} | ${e2.message}`);
    }
  }
}

try {
  const app = getApp();
  handler = serverless(app);
} catch (err) {
  console.error('[Backend Vercel Init Error]:', err);
  handler = async (req, res) => {
    if (res && typeof res.status === 'function') {
      return res.status(500).json({ success: false, error: err.message });
    }
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  };
}

module.exports = async (req, res) => {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return await handler(req, res);
};
