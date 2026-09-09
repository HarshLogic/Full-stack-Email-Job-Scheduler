# 🚀 Deployment & Testing Guide

This guide walks you through deploying the **Full-Stack Email Job Scheduler** to 100% free-tier cloud platforms and testing all its features.

---

## Architecture Overview

| Component | Service | Free Tier |
|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | Unlimited free bandwidth & HTTPS |
| **Backend & Worker** | [Render](https://render.com) | Free web service with continuous deployment |
| **PostgreSQL Database** | [Neon](https://neon.tech) | 0.5 GB free storage, serverless Postgres |
| **Redis Queue & Rate Limiter** | [Upstash](https://upstash.com) | 10,000 commands/day free serverless Redis with TLS |
| **SMTP Delivery** | Ethereal Email | Zero-config automatic test mailboxes with web preview links |
| **Search Engine** | ES / PostgreSQL | Automatic DB fallback enabled (no paid ES cluster required) |

---

## Step 1: Create Free PostgreSQL Database (Neon)

1. Go to **[Neon.tech](https://neon.tech)** and sign up (takes 30 seconds with GitHub).
2. Click **Create Project**, name it `email-scheduler`, and click **Create**.
3. Under **Connection Details**, select **Prisma** or **Postgres** and copy the connection string. It will look like:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
4. In your local project directory, update `backend/.env`:
   ```env
   DATABASE_URL="your-neon-database-url-here"
   ```
5. Apply database migrations to Neon:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
   *(All tables: User, Campaign, Email, SlackConnection will be created instantly)*

---

## Step 2: Create Free Redis Database (Upstash)

1. Go to **[Upstash.com](https://upstash.com)** and sign up.
2. Click **Create Database**:
   - Name: `email-queue`
   - Type: **Regional**
   - Region: Select closest to your Neon database (e.g. `us-east-1`)
   - Eviction: **Disabled** (important for queues)
3. Under **Connect to your database**, find the standard **ioredis / Redis URL** (format: `rediss://default:TOKEN@ENDPOINT:6379`).
4. Copy the URL and add to your `backend/.env`:
   ```env
   REDIS_URL="rediss://default:your-token@your-host.upstash.io:6379"
   ```

---

## Step 3: Deploy Backend & BullMQ Worker (Render)

1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure cloud deployment with Upstash, Neon, and Vercel"
   git push origin main
   ```
2. Go to **[Render.com](https://render.com)** and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `email-scheduler-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free`
5. Add the following **Environment Variables**:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(Your Neon PostgreSQL URL from Step 1)* |
   | `REDIS_URL` | *(Your Upstash Redis URL from Step 2)* |
   | `JWT_SECRET` | *(Generate any random string, e.g. `supersecret987654321`)* |
   | `FRONTEND_URL` | `https://your-frontend.vercel.app` *(or `*` until Vercel deploys)* |
   | `MIN_EMAIL_DELAY_MS` | `2000` |
   | `MAX_EMAILS_PER_HOUR_PER_SENDER` | `3` |
   | `WORKER_CONCURRENCY` | `5` |
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://email-scheduler-backend.onrender.com`).

---

## Step 4: Deploy Frontend (Vercel)

1. Go to **[Vercel.com](https://vercel.com)** and click **Add New...** -> **Project**.
2. Select your GitHub repository.
3. In the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and choose `frontend`
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://email-scheduler-backend.onrender.com/api` |
5. Click **Deploy**.
6. Once completed, Vercel gives you a public URL (e.g. `https://email-scheduler.vercel.app`).
7. Go back to Render -> **email-scheduler-backend** -> **Environment** and update `FRONTEND_URL` with your Vercel URL!

---

## Step 5: End-to-End Verification & Testing Checklist

### 1. Test Authentication
- Open your Vercel URL in your browser.
- Click **⚡ Quick Demo Login (Instant Test)**.
- You will immediately be authenticated and redirected to `/scheduled`!

### 2. Test Scheduling an Email
- Click **Compose** in the sidebar.
- Add recipient email (e.g. `test@example.com` and press Enter).
- Fill in Subject and Body.
- Click **Send Later** and pick a time (e.g. 1 minute from now).
- Click **Done**.
- You will see a success notification and the email will appear in the **Scheduled** tab!

### 3. Test Rate Limiting
- Compose a campaign with 5 recipients.
- Set **Delay between 2 emails** to `2000` (ms) and **Hourly Limit** to `3`.
- Schedule the batch.
- Look at the Render service logs:
  - First 3 emails dispatch spaced by 2000ms.
  - The 4th and 5th emails trigger the hourly rate limit and get rescheduled to the next hour with stagger.

### 4. Inspect Live Queue & Jobs (Bull Board)
- Visit `https://your-backend.onrender.com/admin/queues`
- You can inspect active, delayed, waiting, and completed BullMQ jobs in real time.

### 5. Inspect Sent Emails
- Navigate to the **Sent** tab in your frontend to see sent status.
- In the Render backend logs, each sent email prints an **Ethereal preview URL**:
  ```text
  [Worker] Email clxyz123 sent successfully.
  [Worker] Ethereal preview URL: https://ethereal.email/message/WaQK...
  ```
  Open the preview URL in your browser to inspect the rendered email!
