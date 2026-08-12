const serverless = require('serverless-http');

let handler;

function safeRequire(mod) {
  try {
    return eval('require')(mod);
  } catch (_) {
    return null;
  }
}

try {
  const appModule = safeRequire('../../backend/dist/app');
  if (appModule) {
    const app = appModule.default || appModule;
    handler = serverless(app);
  } else {
    throw new Error('Backend app module not available in Vercel environment');
  }
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
