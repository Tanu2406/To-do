# Todo App

A full-stack todo app with a React, Redux Toolkit, and Sass modules client and
a Node.js/Express API backed by MongoDB Atlas.

## Prerequisites

- Node.js 18 or newer
- A MongoDB Atlas cluster (or another MongoDB deployment)

## Local setup

1. Create a MongoDB Atlas database user with read/write access to the application
   database. Add your development IP address to the Atlas IP access list.
2. Configure the server:

   ```bash
   cd server
   npm install
   ```

   Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` to the
   connection string for your database. URL-encode special characters in the
   username or password. `PORT` defaults to `5000`; `CLIENT_ORIGIN` defaults to
   no origin restrictions for local development.
3. Configure the client:

   ```bash
   cd ../client
   npm install
   ```

   Copy `client/.env.example` to `client/.env`. Set `VITE_API_BASE_URL` to the
   backend URL ending in `/api` (locally, `http://localhost:5000/api`).
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
   MongoDB before it starts accepting requests.

## API

All routes are prefixed with `/api`:

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/get` | List todos |
| `POST` | `/new` | Create a todo with `{ "task": "..." }` |
| `PUT` | `/update/:id` | Update `task` and/or `isCompleted` |
| `DELETE` | `/delete/:id` | Delete a todo |

Todo IDs are MongoDB ObjectIds. Tasks must be non-empty strings up to 255
characters. `isCompleted`, when provided, must be a boolean. Successful create
and update responses retain the `newList` and `updated` response properties.
The API has no authentication; CORS restricts browser origins but does not
restrict direct API clients. Existing rows in the former MySQL database are
not copied automatically. The old `server/schema.sql` is not used by the
MongoDB backend.

## Deployment

### MongoDB Atlas

1. In Atlas, create a dedicated database user with the `readWrite` role on the
   application database. Do not use an Atlas account credential as the
   application database user.
2. Under **Network Access**, allow the outbound IP addresses/ranges shown for
   the Render web service. Prefer this over opening access to every IP address.
   Render's outbound IP ranges may change; keep the Atlas access list in sync.
3. Copy the Atlas connection string and replace its database name with the
   application database name. URL-encode any reserved characters in the user
   name or password. Keep this value in Render's secret environment variable
   settings only.

### Render backend

The root `render.yaml` configures a Node web service using `server/` as its
root, `npm ci` as its build command, `npm start` as its start command, and `/`
as its health check.

1. In Render, create a **Blueprint** from this GitHub repository and review the
   `mern-todo-api` service.
2. Set the secret `MONGODB_URI` environment variable to the Atlas connection
   string. Render supplies `PORT`; the server listens on that port (and uses
   `5000` locally).
3. Set `CLIENT_ORIGIN` to the exact deployed frontend origin, such as
   `https://your-site.netlify.app` (no trailing slash). Multiple origins can be
   comma-separated.
4. Deploy and verify the service health page at `/`.

### Netlify frontend

The existing `client/netlify.toml` configures the frontend build from `client/`.

1. Connect this GitHub repository to Netlify; keep the configured base directory,
   build command, and publish directory.
2. In the Netlify site's environment variables, set `VITE_API_BASE_URL` to the
   Render service URL ending in `/api`, for example
   `https://your-service.onrender.com/api`.
3. Redeploy the site after setting the variable. The frontend build fails if
   `VITE_API_BASE_URL` is missing or is not an absolute HTTP(S) URL.
4. Set Render's `CLIENT_ORIGIN` to the deployed Netlify origin and redeploy the
   backend.

### GitHub Actions deployment

The `.github/workflows/deploy.yml` workflow runs on pushes to `main` and can be
started manually from the `main` branch in GitHub Actions. It installs the
client and server dependencies from their lockfiles, lints the client, runs the
server test suite, builds the client, and deploys `client/dist` to Netlify
production. Deployment is skipped for manual runs on other branches.

Add these repository secrets under **Settings > Secrets and variables >
Actions**:

- `NETLIFY_AUTH_TOKEN`: a Netlify personal access token for the account that
  owns the site.
- `NETLIFY_SITE_ID`: the target Netlify site's ID.

The workflow reads the production `VITE_API_BASE_URL` from the Netlify site's
environment variables, so keep that variable configured for the production
context and Builds scope as described above. No additional GitHub variable or
secret is needed for the API URL. If the site is already configured to publish
automatically from its Git connection, turn off those Git-triggered production
deploys so Netlify cannot publish before the GitHub checks pass.

Never put `MONGODB_URI` or other credentials in frontend variables, source
files, or committed `.env` files. The frontend API URL is public and is not a
secret.

## Tests and build

Run the backend unit/API tests:

```bash
cd server
npm test
```

Build and lint the client:

```bash
cd client
npm run build
npm run lint
```

The backend starts only after MongoDB connects. To verify a deployment, check
the Render health page, load the Netlify app, and create, read, update, and
delete a uniquely named todo; reload the page to verify persistence. Use only
non-sensitive test data.
