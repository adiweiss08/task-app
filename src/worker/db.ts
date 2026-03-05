import { Client } from "pg";

export function getConnectionString(env: Env): string {
  // Production: use Hyperdrive (connection pooling at the edge)
  if ("HYPERDRIVE" in env && env.HYPERDRIVE?.connectionString) {
    return env.HYPERDRIVE.connectionString;
  }
  // Local dev: use DATABASE_URL (run: wrangler secret put DATABASE_URL)
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  throw new Error(
    "No database configured. Set up Hyperdrive in wrangler.json for production, or wrangler secret put DATABASE_URL for local dev."
  );
}

export async function withDb<T>(
  env: Env,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client({
    connectionString: getConnectionString(env),
  });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.end();
  }
}
