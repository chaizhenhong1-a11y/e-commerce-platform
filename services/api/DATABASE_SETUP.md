# Elvane PostgreSQL setup

This increment does not store real database passwords.

## 1. Reset the postgres role password in pgAdmin

Open pgAdmin Query Tool for the local PostgreSQL 17 server and run:

```sql
ALTER USER postgres WITH PASSWORD 'YOUR_NEW_PASSWORD';
```

## 2. Create the Elvane database if it does not exist

In the same Query Tool, run:

```sql
SELECT 'CREATE DATABASE elvane'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'elvane'
)\gexec
```

If `\gexec` is not supported in your pgAdmin Query Tool, use:

```sql
CREATE DATABASE elvane;
```

and ignore the "already exists" error if the database is already present.

## 3. Create `services/api/.env`

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL="postgresql://postgres:YOUR_NEW_PASSWORD@localhost:5432/elvane?schema=public"
PORT=3001
```

If the password contains URL-reserved characters such as `@`, `:`, `/`, `?`, `#`, or `%`, URL-encode the password first.

## 4. Validate and migrate

From `services/api`:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate dev --name init
```

Expected result: Prisma connects to PostgreSQL and creates the initial migration.
