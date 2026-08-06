const serverless = require('serverless-http');

let handler;
try {
  const appModule = require('../dist/app');
  const app = appModule.default || appModule;
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
  return await handler(req, res);
};
