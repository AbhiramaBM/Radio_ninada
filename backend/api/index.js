let app;

function getApp() {
  if (app) return app;
  try {
    const appModule = require('../dist/app');
    app = appModule.default || appModule;
    return app;
  } catch (e1) {
    try {
      require('ts-node').register({ transpileOnly: true });
      const appModule = require('../src/app');
      app = appModule.default || appModule;
      return app;
    } catch (e2) {
      throw new Error(`Failed to load app from dist/app or src/app: ${e1.message} | ${e2.message}`);
    }
  }
}

module.exports = (req, res) => {
  try {
    const expressApp = getApp();
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    return expressApp(req, res);
  } catch (err) {
    console.error('[Backend Vercel Execution Error]:', err);
    if (res && typeof res.status === 'function') {
      return res.status(500).json({ success: false, error: err.message });
    }
    return res.end(JSON.stringify({ success: false, error: err.message }));
  }
};
