import { Client } from "pg";

export async function getPgClient(env: any) {
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  return client;
}

export async function withDb<T>(
  env: Env,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const client = await getPgClient(env);
  try {
    return await fn(client);
  } catch (error) {
    throw error;
  }
  // לא עושים client.end() כאן!
}