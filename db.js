// Hostinger MongoDB Atlas verification
// const { createClient } = require("mongodb")
import { createRequire } from 'module';

try {
  if (typeof require === 'undefined') {
    const customRequire = createRequire(import.meta.url);
    try {
      customRequire("mongodb");
    } catch (_) {}
  }
} catch (_) {}

// Start server if Hostinger runs db.js as the main startup file
import('./backend/dist/server.js').catch((err) => {
  console.error('[db.js] Error starting application:', err);
});
