# Todo App

A full-stack todo app with a React, Redux Toolkit, and Tailwind CSS client, plus a Node.js and Express API backed by MySQL.

## Prerequisites

- Node.js 18 or newer
- MySQL 8 or compatible

## Setup

1. Create the MySQL database and `todos` table using the supplied schema:

   ```bash
   mysql -u YOUR_MYSQL_USER -p < server/schema.sql
   ```

2. Configure the server:

   ```bash
   cd server
   npm install
   ```

   Add the MySQL values from `server/.env.example` to `server/.env`:
   `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. `DB_PORT` defaults to
   `3306`, and the API `PORT` defaults to `5000`.

3. Configure the client:

   ```bash
   cd ../client
   npm install
   ```

   Copy `client/.env.example` to `client/.env`. The default API URL is
   `http://localhost:5000/api`.

4. Start the API and client in separate terminals:

   ```bash
   cd server
   npm run dev
   ```

   ```bash
   cd client
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The API connects to
   MySQL before it starts accepting requests.

## API

All routes are prefixed with `/api`:

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/get` | List todos |
| `POST` | `/new` | Create a todo with `{ "task": "..." }` |
| `PUT` | `/update/:id` | Update `task` and/or `isCompleted` |
| `DELETE` | `/delete/:id` | Delete a todo |

Todo tasks must be non-empty strings up to 255 characters. `isCompleted`, when
provided, must be a boolean. Successful create and update responses retain the
existing `newList` and `updated` response properties used by the client.

## Tests and build

With the server environment configured and the schema created in that database,
run the API integration tests:

```bash
cd server
npm test
```

The CRUD integration test creates a uniquely named row, verifies its persisted
state through the API, and removes it when finished. Build and lint the client
with:

```bash
cd client
npm run build
npm run lint
```
