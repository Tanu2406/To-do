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
   username or password. `PORT` defaults to `5000`; local development allows
   `http://localhost:3000` and `http://127.0.0.1:3000` by default. Set
   `CLIENT_ORIGIN` to a comma-separated list of additional exact frontend
   origins (scheme and host, without a trailing slash).
3. Configure the client:

   ```bash
   cd ../client
   npm install
   ```

   Copy `client/.env.example` to `client/.env`. Set `VITE_API_BASE_URL` to the
   backend URL ending in `/api` (locally, `http://localhost:5000/api`) and
   `VITE_SOCKET_URL` to the backend origin (locally, `http://localhost:5000`).
4. Start the API and client in separate terminals:

   ```bash
   cd server
   npm run dev
   ```

   ```bash
   cd client
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173). The API connects to
   MongoDB before it starts accepting requests. Open the app in two browser
   windows and create, edit, complete, or delete a todo in one; the other window
   should update without refreshing. The connection indicator shows the current
   Socket.IO connection state.

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
JWT authentication protects task routes; CORS additionally restricts browser
origins. Existing rows in the former MySQL database are
not copied automatically. The old `server/schema.sql` is not used by the
MongoDB backend.

## GraphQL tasks and authentication

The React app uses the existing Express/Apollo service at `/graphql` for
authenticated task queries, creation, updates, deletion, and the
`taskChanged` subscription. The existing Socket.IO channel also sends
user-scoped task changes and reports live connection status in the UI.
Registration, login, session restoration, and logout use the Express auth
routes. JWTs are set only in an `HttpOnly`, `SameSite` auth cookie; the browser
does not persist or expose the token to JavaScript. The cookie is sent with
GraphQL and Socket.IO connections, and each task operation is scoped to its
authenticated MongoDB user.

The service continues to use the existing Mongoose connection and models for
both users and tasks. Sequelize is not added because this application has no
active relational data store; introducing one would duplicate task persistence.

## Redis task cache

Start the optional local Redis service with Docker Compose:

```bash
docker compose up -d redis
```

Configure `server/.env` using `server/.env.example`. Task lists are cached for
60 seconds by default under the authenticated user's key. Mutations invalidate
that user's key. Redis connection failures do not stop the API; requests fall
back to MongoDB.

Use login to obtain a
JWT, then send `Authorization: Bearer <token>` with task requests. The cache
source is exposed as `X-Cache: HIT` or `X-Cache: MISS`.

## Prometheus and Grafana monitoring

The backend exposes Prometheus metrics at `/metrics`. Completed HTTP requests
are recorded in `http_requests_total` and
`http_request_duration_seconds`; responses with 4xx or 5xx status codes are
also recorded in `http_request_errors_total`. Route labels use Express route
templates rather than request IDs or raw URLs to avoid high-cardinality metrics.
The scrape endpoint itself is excluded from request tracking.

The root Docker Compose stack runs MongoDB, Redis, the API, the frontend,
Prometheus, and Grafana. Copy `server/.env.example` to `server/.env` and set a
strong `JWT_SECRET`. Optionally copy the root `.env.example` to `.env` and set
a strong `GRAFANA_ADMIN_PASSWORD`. The Compose backend connects to the MongoDB
service using the configured `MONGODB_URI`:

```bash
docker compose up --build -d
```

By default, the frontend is at `http://localhost:8080`, the API and metrics
endpoint are at `http://localhost:5000` and `http://localhost:5000/metrics`,
Prometheus is at `http://localhost:9090`, and Grafana is at
`http://localhost:3001`. Grafana's username defaults to `admin`; its password
comes from `GRAFANA_ADMIN_PASSWORD`. Set `CLIENT_ORIGIN` if the frontend uses a
different origin. The API container connects to the configured MongoDB instance
and to the Compose Redis service. MongoDB data is persisted in the
`mongodb-data` volume.

Prometheus scrapes the API every 15 seconds. Grafana provisions the Prometheus
datasource, the **Todo API Monitoring** dashboard (p50/p95 latency, request
volume, and 4xx/5xx error rate), and a **High API 5xx error rate** alert. The
alert evaluates the rolling 5-minute 5xx ratio and fires when it is above 5%
for 5 minutes. Configure a Grafana contact point and notification policy in
Grafana if alerts should be delivered outside the Grafana UI. Prometheus and
Grafana data persist in named Docker volumes. Set `API_PORT`, `CLIENT_PORT`,
`PROMETHEUS_PORT`, `GRAFANA_PORT`, or `PROMETHEUS_RETENTION` to change the
defaults.

## API security and verification

The Express API uses Helmet's default secure response headers and one CORS
allowlist shared with Socket.IO. `CLIENT_ORIGIN` must contain at least one exact
frontend origin in production; local origins are added automatically only
outside production. Requests without an `Origin` header (such as server-to-server
clients) are not blocked by CORS. Browser CORS is credentialed for the allowed
origins so the HttpOnly session cookie can be used by Apollo and Socket.IO.

API requests are limited to 100 per IP per 15 minutes. Authentication routes
have an additional limit of 10 attempts per IP in the same window. Rate-limit
responses use HTTP `429`, include standard
`RateLimit-*` headers, and return the API's `errorMessage` JSON shape. In
production, the app trusts one reverse-proxy hop for client IP detection; keep
the service behind its configured hosting proxy.

Run `npm test` from `server/` to verify normal API behavior, Helmet headers,
allowed and rejected CORS requests, preflight handling, and both rate limits.
For an additional passive scan with OWASP ZAP Baseline, start the API and run
the following from a terminal with Docker Desktop:

```bash
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:5000
```

Review ZAP's alerts in context; the scan is not a substitute for testing
against the deployed service and its configured frontend origin. Do not include
credentials or sensitive data in scans.

Login credentials are verified against MongoDB users with bcrypt password
hashes; there are no demo-credential fallbacks. The React login and registration
forms use `POST /api/auth/login` and `POST /api/auth/register`; the session
cookie is checked by `GET /api/auth/session` and cleared by
`POST /api/auth/logout`.

## AWS Lambda login

The login Lambda is deployment-ready in `server/lambda/` and shares the
compiled `models/userModel` with the Express API. It returns a JWT whose signing
secret must match `JWT_SECRET` on the task API. API Gateway HTTP API handles
`POST /login` and CORS preflight; the Lambda also validates origins and returns
the matching CORS headers for proxy responses.

1. Install the AWS SAM CLI and configure AWS credentials with permission to
   create Lambda, API Gateway, IAM roles, and CloudFormation resources.
2. From `server/`, run `.\lambda\package-lambda.ps1`. This compiles the shared
   model, installs Lambda-only production dependencies, and creates
   `aws/login-function.zip` (also prepares the package used by SAM).
3. Run `sam build --template-file aws/template.yaml` followed by
   `sam deploy --guided`. Supply the exact deployed frontend origin, the
   MongoDB connection string, and the same JWT secret used by the task API.
   The template marks the database URI and signing secret as NoEcho parameters
   and passes them to Lambda as environment variables.
4. Copy the `LoginUrl` CloudFormation output into the frontend's
   `VITE_LOGIN_API_URL` environment variable, then rebuild and redeploy React.
   Keep `VITE_API_BASE_URL` and `VITE_SOCKET_URL` pointed at the existing task
   API; login and task traffic use separate endpoints.

The AWS deployment has not been run from this workspace. The package and SAM
configuration must be deployed in an AWS account, and the Lambda's network
access to MongoDB Atlas must be configured before production login can succeed.

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
   `https://your-site.netlify.app` (no trailing slash). The backend requires
   this setting in production. Multiple origins can be comma-separated.
4. Deploy and verify the service health page at `/`.

### Netlify frontend

The existing `client/netlify.toml` configures the frontend build from `client/`.

1. Connect this GitHub repository to Netlify; keep the configured base directory,
   build command, and publish directory.
2. In the Netlify site's environment variables, set `VITE_API_BASE_URL` to the
   Render service URL ending in `/api`, for example
   `https://your-service.onrender.com/api`, and `VITE_SOCKET_URL` to the Render
   service origin, for example `https://your-service.onrender.com`.
3. Redeploy the site after setting the variables. The frontend build fails if
   either URL is missing or is not an absolute HTTP(S) URL.
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

The workflow reads the production `VITE_API_BASE_URL` and `VITE_SOCKET_URL` from
the Netlify site's environment variables, so keep both configured for the
production context and Builds scope as described above. No additional GitHub
variable or secret is needed for these public URLs. If the site is already
configured to publish automatically from its Git connection, turn off those
Git-triggered production deploys so Netlify cannot publish before the GitHub
checks pass.

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

Generate a Vite bundle analysis report:

```bash
cd client
npm run build:analyze
```

The interactive treemap report is written to `client/dist/bundle-analysis.html`.
Like the production build, this command requires `VITE_API_BASE_URL` and
`VITE_SOCKET_URL` to be configured in the client environment.

The backend starts only after MongoDB connects. To verify a deployment, check
the Render health page, load the Netlify app, and create, read, update, and
delete a uniquely named todo; reload the page to verify persistence. Use only
non-sensitive test data.
