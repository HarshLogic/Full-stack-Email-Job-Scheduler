# 📬 Full-Stack Email Job Scheduler

A production-grade, distributed Email Job Scheduler built with **Node.js, Express, PostgreSQL, Prisma, Redis, BullMQ, and React (Vite + Tailwind CSS)**.

Designed to reliably handle scheduled email delivery, rate limiting, worker concurrency, and resilient restarts under load.

---

## 👥 1. Collaborator Access

Access has been granted to the required reviewers:
- **`Mitrajit`**
- **`Yadav036`**

*(Repository: [https://github.com/HarshLogic/Full-stack-Email-Job-Scheduler](https://github.com/HarshLogic/Full-stack-Email-Job-Scheduler))*

---

## 🌐 Live Deployments

- **Backend API**: [https://full-stack-email-job-scheduler-me2s.onrender.com](https://full-stack-email-job-scheduler-me2s.onrender.com)
- **API Health Check**: [https://full-stack-email-job-scheduler-me2s.onrender.com/api/health](https://full-stack-email-job-scheduler-me2s.onrender.com/api/health)
- **Bull Board Queue UI**: [https://full-stack-email-job-scheduler-me2s.onrender.com/admin/queues](https://full-stack-email-job-scheduler-me2s.onrender.com/admin/queues)

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    User([User / Browser]) -->|Compose / Schedule| ReactUI[React Vite Frontend]
    ReactUI -->|POST /api/emails/schedule| API[Express API Server]
    API -->|Persist Email & Campaign| Postgres[(PostgreSQL / Neon)]
    API -->|Add Job with Delay| RedisQueue[(Redis / Upstash / BullMQ)]
    
    subgraph Background Worker [BullMQ Worker Cluster]
        RedisQueue -->|Pull Delayed Jobs| Worker[Email Worker]
        Worker -->|Check Min Delay Lock SET NX PX| RateLimit[Redis Distributed Rate Limiter]
        Worker -->|Atomic Hourly INCR| HourlyLimit[Redis Hourly Bucket]
        Worker -->|Send Email| SMTP[Nodemailer / Ethereal SMTP]
        Worker -->|Update Status SENT / FAILED| Postgres
        Worker -->|Rate Limit Alert| Slack[Slack Webhook]
    end
    
    API -->|Queue Metrics| BullBoard[Bull Board Admin UI]
```

### 1. How Scheduling Works
1. **Request Intake**: The user submits an email payload (`recipient`, `subject`, `body`, `scheduledAt`, custom `delay`, `hourlyLimit`) via the React UI or the `POST /api/emails/schedule` API.
2. **Durable Persistence**: The campaign and each recipient email are saved in PostgreSQL via Prisma with an initial status of `SCHEDULED`.
3. **Queue Enqueueing**: Jobs are added in bulk to the BullMQ Redis queue (`email-queue`) with a calculated delay in milliseconds (`scheduledAt - Date.now()`). Each job is assigned a unique deterministic `jobId` corresponding to the database `email.id`.
4. **Execution**: BullMQ uses Redis sorted sets (`zset`) with timestamp scores. When the scheduled timestamp arrives, BullMQ automatically transitions the job from `delayed` to `waiting`, where an available worker picks it up.

### 2. How Persistence on Restart is Handled
- **No In-Memory Timers**: The scheduler does **not** rely on ephemeral `setTimeout` or `setInterval` instances.
- **Durable Redis Storage**: BullMQ persists all scheduled jobs, delayed timestamps, job payloads, and retry counters in Redis keys.
- **Relational Integrity in PostgreSQL**: Every email record persists in PostgreSQL with its lifecycle state (`SCHEDULED` -> `PROCESSING` -> `SENT` / `FAILED`).
- **Server Restart Scenario**: If the backend process crashes or is restarted (e.g. during a deployment or VM restart):
  - No jobs are lost.
  - Upon reconnection, the BullMQ worker immediately reads the Redis state.
  - Future delayed jobs continue counting down to their target timestamps.
  - Any job that was midway through execution when a crash occurred is safely picked up and re-processed according to idempotency rules.
- **Idempotency Guard**: Before dispatching, the worker performs a fresh database lookup. If `email.status === 'SENT'`, it skips execution to guarantee zero duplicate emails.

### 3. How Rate Limiting & Concurrency are Implemented
The application coordinates rate limits across multiple concurrent workers using Redis distributed primitives:

- **Worker Concurrency**: The worker pool processes up to `WORKER_CONCURRENCY=5` jobs concurrently.
- **Minimum Inter-Email Delay (`MIN_EMAIL_DELAY_MS`)**:
  - **Mechanism**: Redis short-lived distributed lock (`SET rate:delay:{senderId} 1 PX {delayMs} NX`).
  - **Behavior**: If acquired, the email dispatches. If not acquired (meaning another email was sent too recently), the worker inspects the remaining lock TTL, moves the job back to delayed status with `job.moveToDelayed()`, and throws a BullMQ `DelayedError`.
- **Hourly Rate Limiter (`MAX_EMAILS_PER_HOUR_PER_SENDER`)**:
  - **Mechanism**: Atomic Redis counters with hour-bucketed keys (`rate:hourly:{senderId}:{YYYY-MM-DDTHH}`).
  - **Zero Race Conditions**: Uses Redis atomic `INCR`. If the incremented value exceeds the hourly limit, the worker calculates the time remaining until the next hour window.
  - **Thundering Herd Prevention (Staggering)**: Instead of rescheduling all overflowing emails to the exact same millisecond at the top of the next hour, each delayed email receives a stagger based on its overage:
    $$\text{Delay} = \text{timeToNextHour} + (\text{overage} \times \text{MIN\_EMAIL\_DELAY\_MS})$$
    This preserves chronological order and prevents sudden CPU/Redis spikes.
- **Slack Alerting**: When a sender hits their hourly limit for the first time in an hour window, an alert is automatically dispatched to their connected Slack account.

---

## 🛠️ Features Implemented

### Backend Features
- [x] **BullMQ Scheduling Engine**: Delayed email dispatch using Redis sorted sets.
- [x] **Distributed Rate Limiting**: Redis `SET NX PX` distributed locks for minimum delay.
- [x] **Atomic Hourly Rate Limiter**: Windowed hour counters with anti-thundering herd staggering.
- [x] **Multi-Worker Concurrency**: Configurable concurrent job processing (`WORKER_CONCURRENCY`).
- [x] **Crash Resilience & Persistence**: Jobs persist in Redis and Postgres across restarts.
- [x] **Auto Ethereal SMTP Fallback**: Automatically provisions free Ethereal test accounts with web preview URLs if no SMTP credentials are provided.
- [x] **Resilient Search Fallback**: Automatically queries PostgreSQL (`contains` case-insensitive) if Elasticsearch is offline.
- [x] **Bull Board UI**: Real-time visual monitoring dashboard for queue status at `/admin/queues`.
- [x] **Authentication**: Google OAuth 2.0 and 1-Click Demo Login (`POST /api/auth/demo-login`) with production cross-site cookies (`sameSite: 'none'`, `secure: true`, `trust proxy`).
- [x] **Slack Integration**: OAuth connection and automated rate limit notifications.

### Frontend Features
- [x] **1-Click Demo Login**: Instantly test the application without needing Google Cloud credentials.
- [x] **Google OAuth Login**: Sign in with Google account.
- [x] **Email Composer**:
  - Multi-recipient pill input with validation.
  - CSV / Text file upload for batch recipient lists with auto-cleaning (`PapaParse`).
  - Send Later popover with datetime-local picker.
  - Custom per-campaign delay (ms) and hourly limit overrides.
- [x] **Scheduled Tab**: Live table of all scheduled and processing emails with search and quick actions.
- [x] **Sent Tab**: History of dispatched and failed emails with status indicators.
- [x] **Email Detail View**: Modal/view showing recipient, subject, body, sent timestamp, and provider message IDs.
- [x] **Search**: Instant search bar filtering by recipient, subject, and body.
- [x] **SPA Routing**: Configured with `vercel.json` rewrites for seamless page reloads on cloud hosts.

---

## 🚀 Setup & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Redis instance (local or free cloud from [Upstash.com](https://upstash.com))
- PostgreSQL instance (local or free cloud from [Neon.tech](https://neon.tech))

---

### Step 1: Environment Variables & Ethereal Setup

#### Backend (`backend/.env`)
Create `backend/.env` (or copy from `backend/.env.example`):

```env
PORT=4000

# Database (Neon or local PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/email_scheduler?schema=public"

# Redis (Upstash rediss:// or local localhost:6379)
REDIS_URL="rediss://default:your-password@your-endpoint.upstash.io:6379"
REDIS_HOST=localhost
REDIS_PORT=6379

# Queue & Rate Limits
WORKER_CONCURRENCY=5
MIN_EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR_PER_SENDER=3

# SMTP Settings (Leave SMTP_USER and SMTP_PASS empty for AUTO Ethereal test accounts!)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# App URLs & Auth
FRONTEND_URL=http://localhost:5173
JWT_SECRET=supersecret1234567890

# Optional Integrations
ELASTICSEARCH_URL=http://localhost:9200
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

> [!TIP]
> **Ethereal Email Setup**:
> - **Option A (Zero-Config / Automatic)**: Leave `SMTP_USER` and `SMTP_PASS` empty. The backend automatically creates an ephemeral Ethereal account on boot and logs the test account and email preview URLs in the console!
> - **Option B (Manual)**: Go to [https://ethereal.email/create](https://ethereal.email/create), click **Create Ethereal Account**, and paste the generated user and pass into `SMTP_USER` and `SMTP_PASS`.

#### Frontend (`frontend/.env`)
Create `frontend/.env`:
```env
# Point to local backend or your deployed Render backend
VITE_API_URL=http://localhost:4000/api
```

---

### Step 2: Run the Backend

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Apply database migrations
npx prisma migrate deploy

# 4. Start backend & BullMQ worker
npm run dev
```
The server will start on `http://localhost:4000`. You can visit `http://localhost:4000/admin/queues` to see the Bull Board dashboard.

---

### Step 3: Run the Frontend

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser. Click **⚡ Quick Demo Login (Instant Test)** to access the dashboard immediately!

---

## 🎥 4. Demo Video (Max 5 Minutes)

> [!NOTE]
> **Demo Video Link**: [Insert your recorded video link here - e.g. Loom, YouTube, or Google Drive]

### Demo Video Checklist & Walkthrough Steps:

1. **Authentication & Overview (0:00 - 0:45)**:
   - Open frontend at `http://localhost:5173` or Vercel URL.
   - Click **⚡ Quick Demo Login** to showcase instant authentication.
   - Tour the sidebar: **Scheduled** tab, **Sent** tab, and **Compose** button.
2. **Scheduling Emails (0:45 - 2:00)**:
   - Click **Compose**.
   - Add recipient emails (or upload a CSV list).
   - Set Subject and Body.
   - Click **Send Later**, pick a time (e.g. 1 minute in the future), and click **Done**.
   - Show the email appearing in the **Scheduled** list.
   - Open Bull Board at `/admin/queues` to show the job in the **Delayed** queue.
3. **Simulating Server Restart (Persistence Test) (2:00 - 3:15)**:
   - Schedule an email for 2 minutes in the future.
   - Stop the backend server (`Ctrl + C` in terminal or restart Render service).
   - Show that the server is down.
   - Start the server again (`npm run dev`).
   - Observe that BullMQ recovers the delayed jobs from Redis and PostgreSQL.
   - When the scheduled timestamp arrives, verify the email dispatches successfully!
4. **Rate Limiting & Delay Behavior Under Load (3:15 - 4:30)**:
   - Compose a batch of 5 emails with `delay = 2000ms` and `hourlyLimit = 3`.
   - Schedule the batch.
   - Watch the worker console / logs:
     - Emails 1, 2, and 3 dispatch spaced by 2000ms.
     - Emails 4 and 5 breach the hourly limit and get automatically rescheduled to the next hour with stagger delay.
5. **Sent Verification & Preview (4:30 - 5:00)**:
   - Open the **Sent** tab in the dashboard.
   - Click the Ethereal email preview link from the worker console (`https://ethereal.email/message/...`) to view the rendered email.

---

## ⚖️ 5. Assumptions, Shortcuts & Trade-offs

1. **Colocated Worker & API Process**:
   - *Trade-off*: The BullMQ worker is imported and started inside `server.ts` within the same process as the Express HTTP server.
   - *Rationale*: Simplifies local development and free-tier single-container hosting (e.g. on Render) without requiring separate paid worker instances. In high-traffic production, workers can be split into dedicated standalone processes simply by running `node dist/workers/emailWorker.js`.
2. **Auto Ethereal Provisioning**:
   - *Shortcut*: If SMTP credentials are omitted, the application uses `nodemailer.createTestAccount()` instead of failing hard.
   - *Rationale*: Allows anyone evaluating or grading the project to test email dispatch immediately with zero SMTP credentials or account creation hurdles.
3. **Database Search Fallback**:
   - *Trade-off*: Elasticsearch index creation is non-blocking. If an Elasticsearch cluster is not supplied, searches fallback to PostgreSQL `ILIKE / contains` queries.
   - *Rationale*: Avoids requiring paid hosted Elasticsearch clusters (which are expensive and not offered on free cloud tiers) while ensuring full search functionality remains available.
4. **Cross-Origin Cookie Authentication**:
   - *Trade-off*: In production, cookies are configured with `sameSite: 'none'` and `secure: true`.
   - *Rationale*: Required for cross-domain communication between Vercel (`vercel.app`) and Render (`onrender.com`).
5. **Idempotency via Status Checking**:
   - *Trade-off*: Before sending, the worker queries PostgreSQL to confirm the email is not already `SENT`.
   - *Rationale*: Prevents duplicate sends even during network partitions or simultaneous worker re-acquisitions.
