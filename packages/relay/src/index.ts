import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { config } from './config.js';

const { app, injectWebSocket } = createApp();

const server = serve(
  { fetch: app.fetch, port: Number(config.PORT) },
  (info) => {
    console.log(`DarkIndex relay listening on http://localhost:${info.port}`);
    console.log(`  Starknet RPC: ${config.STARKNET_RPC_URL}`);
    console.log(`  Time-lock:    ${config.TIME_LOCK_SECONDS}s`);
  }
);

injectWebSocket(server);
