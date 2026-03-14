# GCP Migration Guide -- Nexora

> Step-by-step instructions for migrating Nexora to Google Cloud Platform.
> Estimated monthly cost: ~$10-20/month | GCP Credits: $300

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create GCP Project](#2-create-gcp-project)
3. [Enable Required APIs](#3-enable-required-apis)
4. [Set Up Cloud SQL (PostgreSQL)](#4-set-up-cloud-sql-postgresql)
5. [Set Up Cloud Storage](#5-set-up-cloud-storage)
6. [Set Up Artifact Registry](#6-set-up-artifact-registry)
7. [Set Up Secret Manager](#7-set-up-secret-manager)
8. [Set Up Service Account](#8-set-up-service-account)
9. [Set Up Firebase Hosting](#9-set-up-firebase-hosting)
10. [Deploy Backend to Cloud Run](#10-deploy-backend-to-cloud-run)
11. [Deploy Frontends to Firebase Hosting](#11-deploy-frontends-to-firebase-hosting)
12. [Set Up Cloud Build CI/CD](#12-set-up-cloud-build-cicd)
13. [Migrate Database Data](#13-migrate-database-data)
14. [Verify Everything Works](#14-verify-everything-works)
15. [Environment Variables Reference](#15-environment-variables-reference)
16. [Cost Monitoring](#16-cost-monitoring)

---

## 1. Prerequisites

Before starting, make sure you have:

- [ ] A Google account
- [ ] A credit/debit card (required to activate GCP, even with free credits)
- [ ] `gcloud` CLI installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
- [ ] `firebase-tools` installed: `npm install -g firebase-tools`
- [ ] `docker` installed ([Install Guide](https://docs.docker.com/get-docker/))
- [ ] Node.js 20+ installed
- [ ] Access to your Supabase project (for data export)

### Install and configure gcloud CLI

```bash
# Install gcloud (macOS)
brew install google-cloud-sdk

# Login to your Google account
gcloud auth login

# Set default project (after creating it in step 2)
gcloud config set project nexora
```

---

## 2. Create GCP Project

### Via Console (Recommended for first time)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top bar
3. Click **"New Project"**
4. Enter:
   - **Project name**: `nexora`
   - **Organization**: Leave as "No organization" (personal account)
   - **Location**: Leave default
5. Click **"Create"**
6. Wait ~30 seconds, then select the project from the dropdown

### Via CLI

```bash
gcloud projects create nexora --name="Nexora"
gcloud config set project nexora
```

### Activate Billing

1. Go to [Billing](https://console.cloud.google.com/billing)
2. Link your billing account to the `nexora` project
3. If you have $300 free credits, they will be applied automatically

---

## 3. Enable Required APIs

Run this single command to enable all required APIs at once:

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  firebasehosting.googleapis.com
```

### Verify APIs are enabled

```bash
gcloud services list --enabled
```

You should see all 8 APIs in the output.

---

## 4. Set Up Cloud SQL (PostgreSQL)

This replaces your Supabase PostgreSQL database.

### Create the Instance

```bash
gcloud sql instances create nexora-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-type=SSD \
  --availability-type=zonal
```

> This takes 3-5 minutes. Cost: ~$7-10/month.

### Set the postgres password

```bash
gcloud sql users set-password postgres \
  --instance=nexora-db \
  --password=YOUR_SECURE_PASSWORD_HERE
```

> Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password. Save this -- you'll need it later.

### Create the application database

```bash
gcloud sql databases create nexora \
  --instance=nexora-db
```

### Enable required extensions

Connect to the database:

```bash
gcloud sql connect nexora-db --user=postgres --database=nexora
```

Then run these SQL commands:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
\q
```

### Get the connection name (you'll need this later)

```bash
gcloud sql instances describe nexora-db --format="value(connectionName)"
```

> Save this value. It looks like: `nexora:us-central1:nexora-db`

---

## 5. Set Up Cloud Storage

This replaces Supabase Storage for file uploads.

### Create the bucket

```bash
gcloud storage buckets create gs://nexora-files \
  --location=us-central1 \
  --default-storage-class=STANDARD \
  --uniform-bucket-level-access
```

### Set CORS policy for browser uploads (if needed)

Create a file called `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply it:

```bash
gcloud storage buckets update gs://nexora-files --cors-file=cors.json
204: rm cors.json
```

---

## 6. Set Up Artifact Registry

This stores your Docker container images for Cloud Run.

```bash
gcloud artifacts repositories create nexora-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Nexora container images"
```

### Configure Docker to use Artifact Registry

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## 7. Set Up Secret Manager

Store all your environment variables as secrets. This is more secure than plain env vars.

### Create secrets (one per environment variable)

```bash
# Database
echo -n "YOUR_CLOUD_SQL_CONNECTION_STRING" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Cloud Storage bucket name
echo -n "nexora-files" | \
  gcloud secrets create GCS_BUCKET --data-file=-

# Gemini / Vertex AI (uses Application Default Credentials on Cloud Run, but set project)
echo -n "nexora" | \
  gcloud secrets create GCP_PROJECT_ID --data-file=-

# Upstash Redis (keep existing values)
echo -n "YOUR_UPSTASH_REDIS_REST_URL" | \
  gcloud secrets create UPSTASH_REDIS_REST_URL --data-file=-

echo -n "YOUR_UPSTASH_REDIS_REST_TOKEN" | \
  gcloud secrets create UPSTASH_REDIS_REST_TOKEN --data-file=-

# SMTP (Brevo -- keep existing values)
echo -n "YOUR_SMTP_HOST" | \
  gcloud secrets create SMTP_HOST --data-file=-

echo -n "YOUR_SMTP_PORT" | \
  gcloud secrets create SMTP_PORT --data-file=-

echo -n "YOUR_SMTP_USER" | \
  gcloud secrets create SMTP_USER --data-file=-

echo -n "YOUR_SMTP_PASS" | \
  gcloud secrets create SMTP_PASS --data-file=-

echo -n "YOUR_SMTP_SENDER_EMAIL" | \
  gcloud secrets create SMTP_SENDER_EMAIL --data-file=-

echo -n "YOUR_SMTP_SENDER_NAME" | \
  gcloud secrets create SMTP_SENDER_NAME --data-file=-

# LangSmith (keep existing values)
echo -n "YOUR_LANGSMITH_API_KEY" | \
  gcloud secrets create LANGSMITH_API_KEY --data-file=-

echo -n "YOUR_LANGSMITH_PROJECT" | \
  gcloud secrets create LANGSMITH_PROJECT --data-file=-

# Tavily (keep existing values)
echo -n "YOUR_TAVILY_API_KEY" | \
  gcloud secrets create TAVILY_API_KEY --data-file=-

# Frontend URL
echo -n "https://nexora-ai.web.app" | \
  gcloud secrets create FRONTEND_URL --data-file=-

# Client origin for CORS
echo -n "https://nexora-ai.web.app" | \
  gcloud secrets create CLIENT_ORIGIN --data-file=-
```

> Replace all `YOUR_*` values with your actual credentials from your current `.env` file.

### Verify secrets

```bash
gcloud secrets list
```

---

## 8. Set Up Service Account

Create a dedicated service account for Cloud Run with the minimum required permissions.

### Create the service account

```bash
gcloud iam service-accounts create nexora-runner \
  --display-name="Nexora Cloud Run Service Account"
```

### Grant required roles

```bash
PROJECT_ID=nexora

# Cloud SQL access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:nexora-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Cloud Storage access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:nexora-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Secret Manager access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:nexora-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Vertex AI access (for Gemini 2.5 Flash)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:nexora-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

---

## 9. Set Up Firebase Hosting

Firebase Hosting serves both React frontends (client app + website) as static sites.

### Initialize Firebase

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project root
firebase init hosting
```

When prompted:

- **Project**: Select `nexora` (or create a new Firebase project linked to your GCP project)
- **Public directory**: `client/dist` (we'll configure multi-site later)
- **Single-page app**: **Yes**
- **GitHub deploys**: **No** (we'll use Cloud Build)

### Configure multi-site hosting

After init, the `firebase.json` will be created. The code migration will update it to serve both frontends.

---

## 10. Deploy Backend to Cloud Run

After the code migration is complete (Dockerfile + GCP config changes), deploy:

### Build and push the container

```bash
# From the biz-flow directory
cd biz-flow

docker build -t us-central1-docker.pkg.dev/nexora/nexora-repo/biz-flow:latest .

docker push us-central1-docker.pkg.dev/nexora/nexora-repo/biz-flow:latest
```

### Deploy to Cloud Run

```bash
gcloud run deploy nexora-api \
  --image=us-central1-docker.pkg.dev/nexora/nexora-repo/biz-flow:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --service-account=nexora-runner@nexora.iam.gserviceaccount.com \
  --add-cloudsql-instances=nexora:us-central1:nexora-db \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,GCS_BUCKET=GCS_BUCKET:latest,UPSTASH_REDIS_REST_URL=UPSTASH_REDIS_REST_URL:latest,UPSTASH_REDIS_REST_TOKEN=UPSTASH_REDIS_REST_TOKEN:latest,SMTP_HOST=SMTP_HOST:latest,SMTP_PORT=SMTP_PORT:latest,SMTP_USER=SMTP_USER:latest,SMTP_PASS=SMTP_PASS:latest,SMTP_SENDER_EMAIL=SMTP_SENDER_EMAIL:latest,SMTP_SENDER_NAME=SMTP_SENDER_NAME:latest,LANGSMITH_API_KEY=LANGSMITH_API_KEY:latest,LANGSMITH_PROJECT=LANGSMITH_PROJECT:latest,TAVILY_API_KEY=TAVILY_API_KEY:latest,FRONTEND_URL=FRONTEND_URL:latest,CLIENT_ORIGIN=CLIENT_ORIGIN:latest" \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --port=4000
```

### Get your Cloud Run URL

```bash
gcloud run services describe nexora-api \
  --region=us-central1 \
  --format="value(status.url)"
```

> Save this URL -- your frontends will point to it (e.g., `https://nexora-api-xxxxx-uc.a.run.app`)

---

## 11. Deploy Frontends to Firebase Hosting

### Build the client app

```bash
cd client
echo "VITE_API_URL=https://YOUR-CLOUD-RUN-URL" > .env.production
npm run build
cd ..
```

### Build the website

```bash
cd website
npm run build
cd ..
```

### Deploy to Firebase

```bash
firebase deploy --only hosting
```

### Get your Firebase Hosting URLs

After deploy, Firebase will print the URLs:

- Client app: `https://nexora-ai.web.app`
- Website: `https://nexora-ai-website.web.app` (if multi-site configured)

---

## 12. Set Up Cloud Build CI/CD

Cloud Build will automatically build and deploy when you push to the `production` branch.

### Connect your GitHub repository

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click **"Connect Repository"**
3. Select **GitHub** as the source
4. Authorize and select your `Nexora` repository
5. Click **"Connect"**

### Create the build trigger

```bash
gcloud builds triggers create github \
  --name="deploy-production" \
  --repo-name="Nexora" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^production$" \
  --build-config="cloudbuild.yaml"
```

> Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

### Grant Cloud Build permissions

```bash
PROJECT_NUMBER=$(gcloud projects describe nexora --format="value(projectNumber)")

# Allow Cloud Build to deploy to Cloud Run
gcloud projects add-iam-policy-binding nexora \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

# Allow Cloud Build to act as the service account
gcloud iam service-accounts add-iam-policy-binding \
  nexora-runner@nexora.iam.gserviceaccount.com \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Allow Cloud Build to push to Artifact Registry
gcloud projects add-iam-policy-binding nexora \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

---

## 13. Migrate Database Data

### Export from Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings > Database**
4. Copy the **Connection string** (URI format)

Then dump the data:

```bash
pg_dump "postgresql://postgres:YOUR_SUPABASE_PASSWORD@YOUR_SUPABASE_HOST:5432/postgres" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > supabase_dump.sql
```

### Import into Cloud SQL

```bash
# Upload the dump to Cloud Storage (required for Cloud SQL import)
gcloud storage cp supabase_dump.sql gs://nexora-files/migration/supabase_dump.sql

# Import into Cloud SQL
gcloud sql import sql nexora-db \
  gs://nexora-files/migration/supabase_dump.sql \
  --database=nexora

# Clean up the migration file
gcloud storage rm gs://nexora-files/migration/supabase_dump.sql
rm supabase_dump.sql
```

### Verify the data

```bash
gcloud sql connect nexora-db --user=postgres --database=nexora
```

```sql
-- Check tables exist
\dt

-- Check row counts
SELECT count(*) FROM users;
SELECT count(*) FROM chat_messages;
SELECT count(*) FROM entries;
SELECT count(*) FROM tools_registry;

\q
```

---

## 14. Verify Everything Works

### Checklist

- [ ] **Cloud SQL**: Connect and verify all tables + data
- [ ] **Cloud Run**: Hit the health endpoint
  ```bash
  curl https://YOUR-CLOUD-RUN-URL/health
  ```
- [ ] **Cloud Storage**: Upload a test file via the API
- [ ] **Gemini 2.5 Flash**: Send a test chat message and verify AI response
- [ ] **Firebase Hosting**: Open the client app URL in browser
- [ ] **Auth flow**: Sign up / login with access code
- [ ] **2FA**: Test TOTP generation and verification
- [ ] **Email**: Test forgot-access-code OTP delivery (Brevo)
- [ ] **Redis**: Test OTP storage and 2FA sessions (Upstash)
- [ ] **File upload**: Upload and retrieve a file
- [ ] **Chat**: Full conversation with AI agent
- [ ] **Tasks/Reminders**: Create and verify cron-based reminders
- [ ] **Apps**: Create and interact with an app workspace
- [ ] **Cloud Build**: Push to `production` branch, verify auto-deploy
- [ ] **Cloud Logging**: Check logs in GCP Console

---

## 15. Environment Variables Reference

### Old (Supabase/Mistral) -> New (GCP/Gemini)

| Old Variable                | New Variable                | Notes                           |
| --------------------------- | --------------------------- | ------------------------------- |
| `SUPABASE_URL`              | `DATABASE_URL`              | Cloud SQL connection string     |
| `SUPABASE_SERVICE_ROLE_KEY` | _(removed)_                 | Not needed, using pg directly   |
| `MISTRAL_API_KEY`           | _(removed)_                 | Using Vertex AI ADC instead     |
| `MISTRAL_API_BASE`          | _(removed)_                 | Not needed                      |
| `MISTRAL_MODEL`             | _(removed)_                 | Hardcoded to `gemini-2.5-flash` |
| `AXIOM_TOKEN`               | _(removed)_                 | Using Cloud Logging             |
| `AXIOM_DATASET`             | _(removed)_                 | Using Cloud Logging             |
| _(new)_                     | `GCP_PROJECT_ID`            | Your GCP project ID             |
| _(new)_                     | `GCS_BUCKET`                | Cloud Storage bucket name       |
| _(new)_                     | `CLOUD_SQL_CONNECTION_NAME` | Cloud SQL instance connection   |

### Kept Unchanged

| Variable                   | Service             |
| -------------------------- | ------------------- |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis       |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis       |
| `SMTP_HOST`                | Brevo               |
| `SMTP_PORT`                | Brevo               |
| `SMTP_USER`                | Brevo               |
| `SMTP_PASS`                | Brevo               |
| `SMTP_SENDER_EMAIL`        | Brevo               |
| `SMTP_SENDER_NAME`         | Brevo               |
| `LANGSMITH_API_KEY`        | LangSmith           |
| `LANGSMITH_PROJECT`        | LangSmith           |
| `LANGCHAIN_TRACING_V2`     | LangSmith           |
| `LANGCHAIN_ENDPOINT`       | LangSmith           |
| `LANGCHAIN_API_KEY`        | LangSmith           |
| `LANGCHAIN_PROJECT`        | LangSmith           |
| `TAVILY_API_KEY`           | Tavily              |
| `PORT`                     | Express server port |
| `CLIENT_ORIGIN`            | CORS origin         |
| `FRONTEND_URL`             | Email links         |
| `NODE_ENV`                 | Node environment    |

---

## 16. Cost Monitoring

### Set up a budget alert

```bash
# Via Console (recommended):
# 1. Go to Billing > Budgets & Alerts
# 2. Create a budget of $50/month
# 3. Set alerts at 50%, 80%, 100%
```

### Monthly cost breakdown (estimated)

| Service                        | Est. Cost      |
| ------------------------------ | -------------- |
| Cloud SQL (db-f1-micro)        | ~$7-10         |
| Cloud Run (free tier)          | ~$0-5          |
| Cloud Storage                  | ~$0-2          |
| Gemini 2.5 Flash               | ~$0-3          |
| Firebase Hosting (free tier)   | $0             |
| Cloud Build (free 120 min/day) | $0             |
| Cloud Logging (free 50GB/mo)   | $0             |
| **Total**                      | **~$10-20/mo** |

With $300 credits, this setup lasts **15-30 months**.

---

## Quick Reference Commands

```bash
# View Cloud Run logs
gcloud run services logs read nexora-api --region=us-central1

# Redeploy backend
gcloud run deploy nexora-api --image=us-central1-docker.pkg.dev/nexora/nexora-repo/biz-flow:latest --region=us-central1

# Connect to Cloud SQL
gcloud sql connect nexora-db --user=postgres --database=nexora

# View secrets
gcloud secrets list

# Check Cloud Run status
gcloud run services describe nexora-api --region=us-central1

# Redeploy frontends
firebase deploy --only hosting
```
