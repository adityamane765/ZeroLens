import { RpcProvider } from 'starknet';
import { config } from '../config.js';

let _provider: RpcProvider | null = null;

export function getProvider(): RpcProvider {
  if (!_provider) {
    _provider = new RpcProvider({ nodeUrl: config.STARKNET_RPC_URL });
  }
  return _provider;
}

export interface StarknetEvent {
  from_address: string;
  keys: string[];
  data: string[];
  block_number: number;
  transaction_hash: string;
}

export interface EventSuperset {
  events: StarknetEvent[];
  continuation_token?: string;
}

/**
 * Fetch a broad superset of events with NO address/keys filter.
 * The relay never applies the user's private filter — it fetches everything
 * in the requested range and returns it to the client for local filtering.
 */
export async function fetchEventSuperset(
  fromBlock: number,
  toBlock: number | 'latest',
  chunkSize = 200,
  continuationToken?: string,
): Promise<EventSuperset> {
  const provider = getProvider();

  const filter: Record<string, unknown> = {
    from_block: { block_number: fromBlock },
    to_block: toBlock === 'latest' ? 'latest' : { block_number: toBlock },
    chunk_size: Math.min(chunkSize, 500),
  };

  if (continuationToken) {
    filter['continuation_token'] = continuationToken;
  }

  const result = await provider.getEvents(filter as Parameters<typeof provider.getEvents>[0]);

  return {
    events: result.events.map((e) => ({
      from_address: e.from_address,
      keys: e.keys,
      data: e.data,
      block_number: e.block_number ?? 0,
      transaction_hash: e.transaction_hash,
    })),
    continuation_token: result.continuation_token,
  };
}
