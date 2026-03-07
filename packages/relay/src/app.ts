import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { createNodeWebSocket } from '@hono/node-ws';
import { config } from './config.js';
import { registerClient, deregisterClient, getClientCount } from './ws/dashboardSocket.js';
import { privateEventsRoute } from './routes/privateEvents.js';
import { submitCommitmentRoute } from './routes/submitCommitment.js';
import { revealTxRoute } from './routes/revealTx.js';
import { queueStatusRoute } from './routes/queueStatus.js';

export function createApp() {
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  app.use('*', honoLogger());
  app.use('*', cors({ origin: config.CORS_ORIGIN }));

  app.get('/health', (c) =>
    c.json({ status: 'ok', timestamp: Date.now(), wsClients: getClientCount() })
  );

  // WebSocket for dashboard live updates
  app.get(
    '/ws',
    upgradeWebSocket(() => ({
      onOpen(_, ws) {
        registerClient(ws);
      },
      onClose(_, ws) {
        deregisterClient(ws);
      },
      onMessage(event, ws) {
        if (event.data === 'ping') ws.send('pong');
      },
    }))
  );

  // RPC routes
  app.route('/rpc', privateEventsRoute);
  app.route('/rpc', submitCommitmentRoute);
  app.route('/rpc', revealTxRoute);
  app.route('/rpc', queueStatusRoute);

  return { app, injectWebSocket };
}
