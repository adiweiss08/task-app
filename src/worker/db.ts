import { Client } from "pg";

// משתנה גלובלי שנשאר בזיכרון של ה-Worker בין בקשות
let cachedClient: Client | null = null;

export async function getPgClient(env: Env): Promise<Client> {
  // אם כבר יש חיבור פתוח - נשתמש בו וחסכנו 3 שניות של "התנעה"
  if (cachedClient) {
    // בדיקה קטנה שהחיבור עדיין חי (אופציונלי)
    return cachedClient;
  }

  // תמיד נשתמש ב-DATABASE_URL הישיר (דילוג על Hyperdrive שעושה בעיות קאש)
  const connectionString = env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing! Check your wrangler.json or secrets.");
  }

  const client = new Client({
    connectionString: connectionString,
    // הגדרות SSL לחיבור מאובטח מול Neon
    ssl: {
      rejectUnauthorized: false
    },
    // מונע מהחיבור להיתקע לנצח אם יש תקלה ברשת
    connectionTimeoutMillis: 5000,
  });

  await client.connect();
  cachedClient = client; // שומרים את החיבור בזיכרון לשימוש הבא
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