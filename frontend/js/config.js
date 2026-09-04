/**
 * Radio Ninada 90.4 FM - Client Configuration
 * 
 * DEPLOYMENT MODES:
 * 1. Unified Full-Stack (Default & Recommended):
 *    When frontend and backend are served together (via Express, Docker, unified Render/Railway/VPS):
 *    Leave window.__RADIO_API_BASE__ commented out. The app will automatically connect to '/api'.
 * 
 * 2. Decoupled / Static Hosting:
 *    When frontend is hosted on Vercel, Netlify, or GitHub Pages and backend is on Render/Railway/Fly:
 *    Uncomment and specify your deployed backend URL below:
 */

// window.__RADIO_API_BASE__ = 'https://your-backend-service.onrender.com/api';
