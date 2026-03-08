import { Client } from "pg";

// משתנה גלובלי שנשאר בזיכרון של ה-Worker בין בקשות
let cachedClient: Client | null = null;

export async function getPgClient(env: any) {
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  return client;
}

/** * פונקציה עוטפת לביצוע שאילתות בצורה נקייה.
 * שימי לב: הסרנו את ה-client.end() כדי לא לסגור את הצינור!
 */
export async function withDb<T>(
  env: Env,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const client = await getPgClient(env);
  try {
    return await fn(client);
  } catch (error) {
    // אם הייתה שגיאת חיבור, ננקה את ה-cache כדי שבפעם הבאה ינסה מחדש
    cachedClient = null;
    throw error;
  }
  // לא עושים client.end() כאן!
}