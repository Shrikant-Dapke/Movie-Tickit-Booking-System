import { createApp } from './app.js';
import { connectDB } from './lib/db.js';
import { env } from './config/env.js';

const RETRY_MS = 3000;

const start = async () => {
  // Retry instead of exiting: starting the frontend before MongoDB is up is a
  // common local-dev mistake that previously left port 5000 dead and produced
  // an opaque "Network Error" in the browser.
  for (let attempt = 1; ; attempt += 1) {
    try {
      await connectDB();
      break;
    } catch (error) {
      console.error(
        `[startup] MongoDB unavailable (attempt ${attempt}) at ${env.MONGODB_URI.replace(/\/\/[^@]+@/, '//***@')}`,
      );
      console.error('[startup] Start mongod as a single-node replica set, then the API will connect automatically.');
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`CineBook API listening on http://localhost:${env.PORT}/api`);
    console.log(`Health check: http://localhost:${env.PORT}/api/health`);
    console.log(`Database: ${env.MONGODB_URI.replace(/\/\/[^@]+@/, '//***@')}`);
  });
};

start().catch((error) => {
  console.error('Failed to start CineBook API:', error);
  process.exit(1);
});
