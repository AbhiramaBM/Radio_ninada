const serverless = require('serverless-http');

let handler;

try {
  const appModule = require('../../backend/dist/app');
  const app = appModule.default || appModule;
  handler = serverless(app);
} catch (err) {
  console.error('[Vercel API Init Error]:', err);
  handler = async (req, res) => {
    if (res && typeof res.status === 'function') {
      return res.status(500).json({
        success: false,
        error: 'API Initialization Error',
        message: err.message,
        stack: err.stack,
      });
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'API Initialization Error',
        message: err.message,
        stack: err.stack,
      }),
    };
  };
}

module.exports = async (req, res) => {
  try {
    return await handler(req, res);
  } catch (err) {
    console.error('[Vercel API Runtime Error]:', err);
    if (res && typeof res.status === 'function') {
      return res.status(500).json({
        success: false,
        error: 'API Handler Runtime Error',
        message: err.message,
        stack: err.stack,
      });
    }
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'API Handler Runtime Error',
        message: err.message,
        stack: err.stack,
      }),
    };
  }
};
