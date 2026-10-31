# IT Expense & Resource Management

## Configure MongoDB Atlas

1. Copy `.env.example` to `.env`.
2. Replace `MONGODB_URI` with the Atlas connection string for your cluster. URL-encode special characters in the database username or password.
3. Set `MONGODB_DB_NAME`, `ADMIN_EMAIL`, `ADMIN_NAME`, and a unique `ADMIN_PASSWORD` (at least 8 characters).
4. In Atlas, allow the app server's IP in Network Access and grant the database user read/write access to the selected database.
5. Run `npm install`, then `npm run dev`.

The first run creates the administrator in MongoDB only if the users collection is empty. Create employee accounts in User Management; each account receives a password at creation. The old `.db_state.json` demo store has been removed. Application records use MongoDB collections and are not seeded with sample records.

MongoDB credentials are server-only. Do not put the connection string in a `VITE_` variable or commit `.env`.
