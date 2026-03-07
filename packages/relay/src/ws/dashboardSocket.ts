import type { WSContext } from 'hono/ws';
import type { WsMessage } from '../types/index.js';

const clients = new Set<WSContext>();

export function registerClient(ws: WSContext): void {
  clients.add(ws);
}

export function deregisterClient(ws: WSContext): void {
  clients.delete(ws);
}

export function broadcastToClients(message: WsMessage): void {
  const payload = JSON.stringify(message);
  for (const ws of clients) {
    try {
      ws.send(payload);
    } catch {
      clients.delete(ws);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
