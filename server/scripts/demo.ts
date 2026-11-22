/**
 * Jury fallback demo: starts an in-memory MongoDB replica set, seeds realistic
 * data and runs the API. Useful when no local MongoDB is available.
 * The primary documented demo path uses a real MongoDB single-node replica set.
 */
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

(async () => {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = replSet.getUri('cinebook_live_demo');
  process.env.JWT_SECRET = 'live-demo-secret-at-least-32-characters-long';
  await import('../src/seed/seed.js');
  const deadline = Date.now() + 30_000;
  while (mongoose.connection.readyState !== 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await import('../src/server.js');
  console.log('CineBook in-memory demo ready on http://localhost:5000/api');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
