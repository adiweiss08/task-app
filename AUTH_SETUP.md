# Authentication Setup

## 1. Run the Database Migration

Before using the app, run the auth migration against your Neon PostgreSQL database:

```bash
# Using psql (replace with your Neon connection string)
psql "YOUR_NEON_DATABASE_URL" -f migrations/5_auth.sql
```

Or run the SQL manually in the Neon Console:
- Creates `users` table (id, username, password_hash, created_at)
- Adds `user_id` column to `todos` and `birthdays`
- Creates indexes on `user_id`

## 2. JWT Secret (Production)

For production, set a strong JWT secret as a Cloudflare Worker secret:

```bash
wrangler secret put JWT_SECRET
```

Enter a long random string (e.g. 32+ characters). The default in `wrangler.json` vars is for development only.

## 3. CORS Origins

If you deploy the frontend to a new domain, add it to the CORS `origin` list in `src/worker/index.ts`.
