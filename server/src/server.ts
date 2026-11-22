import { createApp } from './app.js';
import { connectDB } from './lib/db.js';
import { env } from './config/env.js';

const start = async () => {
  await connectDB();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`CineBook API listening on http://localhost:${env.PORT}/api`);
  });
};

start().catch((error) => {
  console.error('Failed to start CineBook API:', error);
  process.exit(1);
});
